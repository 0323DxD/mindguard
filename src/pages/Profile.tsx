import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  // Trusted Contacts State
  const [contacts, setContacts] = React.useState<{id: string, name: string, phone: string}[]>([]);
  const [isAdding, setIsAdding] = React.useState(false);
  const [newContact, setNewContact] = React.useState({ name: '', phone: '' });

  // Load contacts from local storage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('trusted_contacts');
    if (saved) {
      setContacts(JSON.parse(saved));
    }
  }, []);

  // Save contacts to local storage whenever they change
  React.useEffect(() => {
    localStorage.setItem('trusted_contacts', JSON.stringify(contacts));
  }, [contacts]);

  const handleAddContact = () => {
    if (!newContact.name || !newContact.phone) return;
    setContacts([...contacts, { id: Date.now().toString(), ...newContact }]);
    setNewContact({ name: '', phone: '' });
    setIsAdding(false);
  };

  const handleDeleteContact = (id: string) => {
    setContacts(contacts.filter(c => c.id !== id));
  };

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
          
          {contacts.length === 0 && !isAdding && (
            <p className="text-sm text-gray-500 mb-3">No emergency contacts added.</p>
          )}

          <div className="space-y-2 mb-3">
            {contacts.map(contact => (
              <div key={contact.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                <div>
                  <div className="font-medium text-sm">{contact.name}</div>
                  <div className="text-xs text-gray-500">{contact.phone}</div>
                </div>
                <button 
                  onClick={() => handleDeleteContact(contact.id)}
                  className="text-red-500 hover:text-red-700 text-xs px-2"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {isAdding ? (
            <div className="bg-gray-50 p-3 rounded-xl space-y-2 border border-gray-200">
              <input 
                placeholder="Contact Name" 
                className="w-full p-2 text-sm border rounded-lg"
                value={newContact.name}
                onChange={e => setNewContact({...newContact, name: e.target.value})}
              />
              <input 
                placeholder="Phone Number" 
                className="w-full p-2 text-sm border rounded-lg"
                value={newContact.phone}
                onChange={e => setNewContact({...newContact, phone: e.target.value})}
              />
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={handleAddContact} className="flex-1">Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)} className="flex-1">Cancel</Button>
              </div>
            </div>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full border-dashed"
              onClick={() => setIsAdding(true)}
            >
              + Add Contact
            </Button>
          )}
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
