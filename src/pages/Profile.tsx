import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth(); // Assuming user info is in context or we mock it for now

  // Mock user data matching the prototype
  const user = {
    fullname: 'Student User',
    email: 'email@lspu.edu.ph',
    studentid: '-',
    program: '-'
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
          ←
        </Button>
        <h3 className="text-xl font-bold text-primary m-0">My Profile</h3>
      </div>

      <Card>
        <div className="flex justify-between items-start mb-4">
          <div>
            <strong className="block text-lg">{user.fullname}</strong>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" size="sm">Edit</Button>
             <Button variant="primary" size="sm" className="bg-red-600 hover:bg-red-700 border-red-600" onClick={handleLogout}>Logout</Button>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 mt-2 space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-24 text-gray-500 text-sm">Student ID</div>
            <div>{user.studentid}</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-24 text-gray-500 text-sm">Program</div>
            <div>{user.program}</div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 mt-4">
          <h4 className="font-bold mb-2">Emergency Contacts</h4>
          <p className="text-sm text-gray-500 mb-3">No emergency contacts added.</p>
          <Button variant="outline" size="sm" className="w-full border-dashed">
            + Add Contact
          </Button>
        </div>

        <div className="border-t border-gray-100 pt-4 mt-4">
          <h4 className="font-bold mb-2">Data & Privacy</h4>
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm">Export My Data</Button>
            <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">Delete Account</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
