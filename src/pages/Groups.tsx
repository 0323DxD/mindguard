import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export const Groups: React.FC = () => {
  const navigate = useNavigate();

  const groups = [
    {
      id: 1,
      name: 'Academic Anxiety',
      type: 'Online',
      schedule: 'Tuesdays · 5PM',
      facilitator: 'Denmhar',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      id: 2,
      name: 'Social Isolation',
      type: 'Hybrid',
      schedule: 'Fridays · 3PM',
      facilitator: 'Nicole',
      color: 'bg-orange-50 text-orange-600'
    }
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
          ←
        </Button>
        <h3 className="text-xl font-bold text-primary m-0">Ka-PEER Yu Groups</h3>
      </div>

      <p className="text-gray-500 text-sm">Join a student-led support group. Anonymous & safe.</p>

      {groups.map(group => (
        <Card key={group.id} className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <strong className="text-lg">{group.name}</strong>
            <span className={`text-xs px-2 py-1 rounded-full ${group.color}`}>
              {group.type}
            </span>
          </div>
          <p className="text-sm text-gray-600 m-0">
            {group.schedule} · Facilitator: {group.facilitator}
          </p>
          <div className="mt-2">
            <Button variant="outline" size="sm" className="w-full">
              Join Group
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};
