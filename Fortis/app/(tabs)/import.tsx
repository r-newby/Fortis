import { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '../../lib/supabase';

type ExerciseDBItem = {
  name: string;
  bodyPart: string;
  target: string;
  equipment: string;
  gifUrl: string;
};

type ExerciseInsert = {
  name: string;
  target: string;
  body_part: string;
  equipment: string;
  gif_url: string;
};

export default function ImportExercisesScreen() {
  const [status, setStatus] = useState('Starting...');
  const [log, setLog] = useState<string[]>([]);

  const logMessage = (msg: string) => {
    console.log(msg);
    setLog((prev) => [...prev, msg]);
  };

  const fetchExercisesFromAPI = async (): Promise<ExerciseDBItem[]> => {
    const { rapidApiKey, rapidApiHost } = Constants.expoConfig?.extra ?? {};

    const url = 'https://exercisedb.p.rapidapi.com/exercises?limit=0';

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': rapidApiHost,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched from API:', data.length);
      return data;
    } catch (err) {
      console.error('Failed to fetch exercises:', err);
      return [];
    }
  };

  const fetchExistingExerciseNames = async (): Promise<string[]> => {
    const { data, error } = await supabase
      .from('exercises')
      .select('name')
      .range(0, 9999);

    if (error) {
      console.error('Error fetching existing names:', error.message);
      return [];
    }

    return (data ?? []).map((item: { name: string }) =>
      item.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
    );
  };

  const chunkArray = <T,>(arr: T[], size: number): T[][] => {
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  };

  useEffect(() => {
    const importExercises = async () => {
      setStatus('Fetching from ExerciseDB...');
      const apiData = await fetchExercisesFromAPI();
      logMessage(`Fetched ${apiData.length} exercises from ExerciseDB.`);

      setStatus('Checking existing exercises in Supabase...');
      const existingNames = await fetchExistingExerciseNames();

      const normalize = (name: string) =>
        name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

      const [insertList, duplicateList] = apiData.reduce<[
        ExerciseInsert[],
        string[]
      ]>(
        ([insertAcc, dupAcc], ex) => {
          const nameKey = normalize(ex.name);
          const isDuplicate = existingNames.includes(nameKey);

          if (ex.gifUrl && !isDuplicate) {
            insertAcc.push({
              name: ex.name.trim(),
              target: ex.target,
              body_part: ex.bodyPart,
              equipment: ex.equipment,
              gif_url: ex.gifUrl,
            });
          } else if (isDuplicate) {
            dupAcc.push(ex.name);
          }

          return [insertAcc, dupAcc];
        },
        [[], []]
      );

      if (!insertList.length) {
        setStatus('No new exercises to insert.');
        logMessage(`Skipped ${duplicateList.length} duplicates`);
        return;
      }

      const chunks = chunkArray(insertList, 500);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        setStatus(`Inserting exercises... (${i + 1}/${chunks.length})`);

        const { error } = await supabase.from('exercises').insert(chunk);
        if (error) {
          logMessage(`Chunk ${i + 1} failed: ${error.message}`);
          setStatus('Error during insert. Check logs.');
          return;
        }

        logMessage(`Chunk ${i + 1}: Inserted ${chunk.length} exercises`);
      }

      setStatus('Import complete!');
    };

    importExercises();
  }, []);

  return (
    <ScrollView style={{ paddingTop: 100, paddingHorizontal: 20 }}>
      <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{status}</Text>
      {log.map((msg, idx) => (
        <Text key={idx} style={{ fontSize: 14, marginTop: 4 }}>{msg}</Text>
      ))}
    </ScrollView>
  );
}