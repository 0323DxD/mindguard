import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export const Booking: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
          ←
        </Button>
        <h3 className="text-xl font-bold text-primary m-0">Book Counselor</h3>
      </div>

      <Card className="flex flex-col gap-4">
        <div>
          <h4 className="font-bold mb-2">Select a date</h4>
          <Input type="date" className="w-full" />
        </div>

        <div>
          <h4 className="font-bold mb-2">Select time</h4>
          <select className="w-full p-3 rounded-xl border border-gray-200 bg-white">
            <option value="09:00">9:00 AM - 10:00 AM</option>
            <option value="10:00">10:00 AM - 11:00 AM</option>
            <option value="14:00">2:00 PM - 3:00 PM</option>
          </select>
        </div>

        <div>
           <h4 className="font-bold mb-2">Mode</h4>
           <div className="flex gap-4">
             <label className="flex items-center gap-2">
               <input type="radio" name="mode" value="online" defaultChecked /> Online (Zoom)
             </label>
             <label className="flex items-center gap-2">
               <input type="radio" name="mode" value="f2f" /> Face-to-Face (LSPU)
             </label>
           </div>
        </div>

        <Button className="w-full mt-2">Confirm Booking</Button>
      </Card>
    </div>
  );
};
