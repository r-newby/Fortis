import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { supabase } from '../../lib/supabase'; // adjust this path if needed

export default function HomeScreen() {
  const [status, setStatus] = useState('Checking connection...');
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    const testConnection = async () => {
      const { data, error } = await supabase.from('exercises').select('*').limit(1);
      if (error) {
        console.error('Supabase error:', error.message);
        setStatus('Failed to connect to Supabase');
      } else {
        setStatus('Connected to Supabase');
        setRows(data || []);
      }
    };

    testConnection();
  }, []);

  return (
    <View style={{ padding: 20, paddingTop: 80 }}>
      <Text>{status}</Text>
      {rows.length > 0 && <Text>First exercise: {rows[0].name}</Text>}
    </View>
  );
}
