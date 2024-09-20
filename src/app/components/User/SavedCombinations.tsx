// app/profile/components/SavedCombinations.tsx
import React from 'react';

interface SavedCombinationsProps {
  combinations: Array<{ id: string; name: string }>;
}

const SavedCombinations: React.FC<SavedCombinationsProps> = ({ combinations }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Grades Salvas</h3>
      {combinations.length > 0 ? (
        <ul>
          {combinations.map(combination => (
            <li key={combination.id}>{combination.name}</li>
          ))}
        </ul>
      ) : (
        <p>Nenhuma grade salva ainda.</p>
      )}
    </div>
  );
};

export default SavedCombinations;