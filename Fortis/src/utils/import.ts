import Constants from 'expo-constants';
import { supabase } from '../supabase';

// Types for ExerciseDB and Supabase insert
type ExerciseDBItem = {
  id: string;
  name: string;
  target: string;
  bodyPart: string;
  equipment: string;
  gifUrl?: string;
};

type ExerciseInsert = {
  exercisedb_id: string;
  name: string;
  target: string;
  body_part: string;
  equipment: string;
  gif_url: string;
  image_url: string;
};

const normalize = (name: string) =>
  name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

// Fetch image URL from ExerciseDB API
const fetchImageUrl = async (id: string, apiKey: string, apiHost: string) => {
const resolution = 'medium'; 
const url = `https://exercisedb.p.rapidapi.com/image?exerciseId=${id}&resolution=${resolution}&rapidapi-key=${apiKey}`;


  try {
    const res = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': apiHost,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.warn(`Image fetch failed for ${id}:`, res.status, errorText);
      return '';
    }

    const data = await res.json();
    return data?.url ?? '';
  } catch (err: any) {
    console.warn(`Fetch error for ${id}:`, err.message);
    return '';
  }
};

export async function importExercises() {
  const { rapidApiKey, rapidApiHost } = Constants.expoConfig?.extra ?? {};
  const url = `https://${rapidApiHost}/exercises?limit=0`;

  console.log('Fetching:', url);
  const response = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': rapidApiKey,
      'X-RapidAPI-Host': rapidApiHost,
    },
  });

  if (!response.ok) throw new Error(`API Error: ${response.status}`);

  const apiData: ExerciseDBItem[] = await response.json();
  console.log(`Fetched ${apiData.length} exercises`);

  const insertList: ExerciseInsert[] = [];

  for (const ex of apiData) {
    await new Promise(resolve => setTimeout(resolve, 100)); // Throttle to avoid 429 errors
    const image_url = await fetchImageUrl(ex.id, rapidApiKey, rapidApiHost);

    insertList.push({
      exercisedb_id: ex.id,
      name: ex.name.trim(),
      target: ex.target,
      body_part: ex.bodyPart,
      equipment: ex.equipment,
      gif_url: `https://d205bpvrqc9yn1.cloudfront.net/${ex.id}.gif`,
      image_url,
    });
  }

  console.log(`Prepared ${insertList.length} exercises with images`);

  const { error } = await supabase.from('exercises').upsert(insertList, {
    onConflict: 'exercisedb_id'
,
  });

  if (error) {
    console.error('Upsert error:', error.message);
  } else {
    console.log(`Successfully upserted ${insertList.length} exercises`);
  }
}
