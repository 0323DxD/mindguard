import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useAuth } from '../../context/AuthContext';
import styles from './Dashboard.module.css'; // Reusing dashboard styles for card look

export default function ManageUsers() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'students' | 'admins'>('students');

  // Students State
  const [students, setStudents] = useState<any[]>([]);
  const [searchStudent, setSearchStudent] = useState('');
  const [riskFilter, setRiskFilter] = useState('');

  // Admins State
  const [admins, setAdmins] = useState<any[]>([]);

  // Modals
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);

  // Form State
  const [studentForm, setStudentForm] = useState({ id: '', fullname: '', email: '', student_id: '', program: '', password: '' });
  const [adminForm, setAdminForm] = useState({ id: '', fullname: '', email: '', role: '', password: '', confirm_password: '' });

  useEffect(() => {
    if (activeTab === 'students') fetchStudents();
    else fetchAdmins();
  }, [activeTab]);

  const fetchStudents = async () => {
    try {
      const { data } = await axios.get('/api/admin/students');
      // For simplicity in this demo, deduping based on distinct emails 
      // since the backend /admin/students actually returns chat sessions joined with users.
      // Wait, in our main.py we modified GET /api/admin/students to return users? 
      // Ah, our backend returns sessions. We should actually map unique users from it.
      const uniqueUsers = Array.from(new Set(data.map((s: any) => s.user_email))).map(email => {
        return data.find((s: any) => s.user_email === email);
      });
      setStudents(uniqueUsers);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdmins = async () => {
    try {
      const { data } = await axios.get('/api/admin/admins');
      setAdmins(data);
    } catch (err) {
      console.error(err);
    }
  };

  // ─── STUDENT ACTIONS ──────────────────────────────────────────
  const openStudentModal = (studentData: any = null) => {
    if (studentData) {
      setEditingStudent(studentData);
      setStudentForm({ 
        id: studentData.user_id, 
        fullname: studentData.fullname, 
        email: studentData.user_email, 
        student_id: studentData.student_id, 
        program: studentData.course, 
        password: '' 
      });
    } else {
      setEditingStudent(null);
      setStudentForm({ id: '', fullname: '', email: '', student_id: '', program: '', password: '' });
    }
    setIsStudentModalOpen(true);
  };

  const handleSaveStudent = async () => {
    try {
      if (editingStudent) {
        await axios.put(`/api/admin/students/${studentForm.id}`, studentForm);
      } else {
        await axios.post('/api/admin/students', studentForm);
      }
      setIsStudentModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save student');
    }
  };

  const handleDeleteStudent = async (id: number) => {
    if (window.confirm("Are you sure? This action cannot be undone.")) {
      try {
        await axios.delete(`/api/admin/students/${id}`);
        fetchStudents();
      } catch (err) {
        alert('Failed to delete student');
      }
    }
  };

  // ─── ADMIN ACTIONS ──────────────────────────────────────────
  const openAdminModal = (adminData: any = null) => {
    if (adminData) {
      setEditingAdmin(adminData);
      setAdminForm({ 
        id: adminData.id, 
        fullname: adminData.fullname, 
        email: adminData.email, 
        role: adminData.role_title, 
        password: '', confirm_password: '' 
      });
    } else {
      setEditingAdmin(null);
      setAdminForm({ id: '', fullname: '', email: '', role: 'Guidance Office', password: '', confirm_password: '' });
    }
    setIsAdminModalOpen(true);
  };

  const handleSaveAdmin = async () => {
    if (!editingAdmin && adminForm.password !== adminForm.confirm_password) {
      return alert("Passwords do not match");
    }
    
    try {
      if (editingAdmin) {
        await axios.put(`/api/admin/admins/${adminForm.id}?requester_email=${user?.email}`, adminForm);
      } else {
        await axios.post(`/api/admin/admins?requester_email=${user?.email}`, adminForm);
      }
      setIsAdminModalOpen(false);
      fetchAdmins();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save admin');
    }
  };

  const handleDeleteAdmin = async (id: number) => {
    if (window.confirm("Are you sure? This action cannot be undone.")) {
      try {
        await axios.delete(`/api/admin/admins/${id}?requester_email=${user?.email}`);
        fetchAdmins();
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Failed to delete admin');
      }
    }
  };

  // ─── RENDERERS ──────────────────────────────────────────
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.fullname?.toLowerCase().includes(searchStudent.toLowerCase()) || 
                          s.user_email?.toLowerCase().includes(searchStudent.toLowerCase());
    const matchesRisk = riskFilter ? s.highest_risk_level?.toString() === riskFilter : true;
    return matchesSearch && matchesRisk;
  });

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Manage Users</h2>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e5e7eb', marginBottom: '2rem' }}>
        <button 
          onClick={() => setActiveTab('students')}
          style={{ padding: '0.75rem 1rem', borderBottom: activeTab === 'students' ? '2px solid #0f766e' : 'none', color: activeTab === 'students' ? '#0f766e' : '#6b7280', fontWeight: 600 }}
        >
          Students
        </button>
        <button 
          onClick={() => setActiveTab('admins')}
          style={{ padding: '0.75rem 1rem', borderBottom: activeTab === 'admins' ? '2px solid #0f766e' : 'none', color: activeTab === 'admins' ? '#0f766e' : '#6b7280', fontWeight: 600 }}
        >
          Administrators
        </button>
      </div>

      {/* ─── STUDENTS TAB ─── */}
      {activeTab === 'students' && (
        <div style={{ backgroundColor: '#fff', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '1rem', flex: 1, maxWidth: '600px' }}>
              <input 
                placeholder="Search by name or email..." 
                value={searchStudent} onChange={(e) => setSearchStudent(e.target.value)}
                style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', width: '100%' }}
              />
              <select 
                value={riskFilter} onChange={e => setRiskFilter(e.target.value)}
                style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: '#fff' }}
              >
                <option value="">All Risks</option>
                <option value="0">Low Risk (0)</option>
                <option value="1">Medium Risk (1)</option>
                <option value="2">High Risk (2+)</option>
              </select>
            </div>
            <Button onClick={() => openStudentModal()}>+ Add Student</Button>
          </div>

          <div style={{ overflowX: 'auto' }}>
             <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
               <thead>
                 <tr style={{ backgroundColor: '#f9fafb', color: '#4b5563', fontSize: '0.875rem' }}>
                   <th style={{ padding: '1rem' }}>Name</th>
                   <th style={{ padding: '1rem' }}>ID & Course</th>
                   <th style={{ padding: '1rem' }}>Latest Mood</th>
                   <th style={{ padding: '1rem' }}>Risk Level</th>
                   <th style={{ padding: '1rem' }}>Actions</th>
                 </tr>
               </thead>
               <tbody>
                 {filteredStudents.map((s, idx) => (
                   <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                     <td style={{ padding: '1rem' }}>
                       <div style={{ fontWeight: 600 }}>{s.fullname !== 'N/A' ? s.fullname : s.user_email.split('@')[0]}</div>
                       <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{s.user_email}</div>
                     </td>
                     <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                       <div>{s.student_id}</div>
                       <div style={{ color: '#6b7280' }}>{s.course !== 'N/A' ? s.course : 'Guest'}</div>
                     </td>
                     <td style={{ padding: '1rem' }}>{s.latest_mood}</td>
                     <td style={{ padding: '1rem' }}>
                       <span style={{ 
                         padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600,
                         backgroundColor: s.highest_risk_level >= 2 ? '#fee2e2' : '#d1fae5',
                         color: s.highest_risk_level >= 2 ? '#b91c1c' : '#047857'
                       }}>
                         Risk: {s.highest_risk_level}
                       </span>
                     </td>
                     <td style={{ padding: '1rem' }}>
                       <div style={{ display: 'flex', gap: '0.5rem' }}>
                         <button onClick={() => openStudentModal(s)} style={{ color: '#2563eb', fontSize: '0.875rem', fontWeight: 600 }}>Edit</button>
                         <button onClick={() => handleDeleteStudent(s.user_id)} style={{ color: '#dc2626', fontSize: '0.875rem', fontWeight: 600 }}>Delete</button>
                       </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
             {filteredStudents.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>No students found.</div>}
          </div>
        </div>
      )}

      {/* ─── ADMINS TAB ─── */}
      {activeTab === 'admins' && (
        <div style={{ backgroundColor: '#fff', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
            {user?.is_primary_admin && (
              <Button onClick={() => openAdminModal()}>+ Add New Admin</Button>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
             <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
               <thead>
                 <tr style={{ backgroundColor: '#f9fafb', color: '#4b5563', fontSize: '0.875rem' }}>
                   <th style={{ padding: '1rem' }}>Full Name</th>
                   <th style={{ padding: '1rem' }}>Email</th>
                   <th style={{ padding: '1rem' }}>Role</th>
                   <th style={{ padding: '1rem' }}>Primary</th>
                   <th style={{ padding: '1rem' }}>Actions</th>
                 </tr>
               </thead>
               <tbody>
                 {admins.map((a, idx) => (
                   <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                     <td style={{ padding: '1rem', fontWeight: 600 }}>{a.fullname || 'Unknown Admin'}</td>
                     <td style={{ padding: '1rem', color: '#6b7280' }}>{a.email}</td>
                     <td style={{ padding: '1rem' }}>{a.role_title || 'Administrator'}</td>
                     <td style={{ padding: '1rem' }}>
                       {a.is_primary && <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#e0e7ff', color: '#4338ca', fontSize: '0.75rem', borderRadius: '0.25rem', fontWeight: 600 }}>Primary Admin</span>}
                     </td>
                     <td style={{ padding: '1rem' }}>
                       {(!a.is_primary && user?.is_primary_admin) && (
                         <div style={{ display: 'flex', gap: '0.5rem' }}>
                           <button onClick={() => openAdminModal(a)} style={{ color: '#2563eb', fontSize: '0.875rem', fontWeight: 600 }}>Edit</button>
                           <button onClick={() => handleDeleteAdmin(a.id)} style={{ color: '#dc2626', fontSize: '0.875rem', fontWeight: 600 }}>Delete</button>
                         </div>
                       )}
                       {a.id === user?.id && <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>(You)</span>}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </div>
      )}


      {/* ─── MODALS ─── */}
      {isStudentModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="custom-scrollbar" style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '0.5rem', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>{editingStudent ? 'Edit Student' : 'Add New Student'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Input label="Full Name" value={studentForm.fullname} onChange={e => setStudentForm({...studentForm, fullname: e.target.value})} fullWidth />
              <Input label="Email" type="email" value={studentForm.email} onChange={e => setStudentForm({...studentForm, email: e.target.value})} fullWidth />
              <Input label="Student ID" value={studentForm.student_id} onChange={e => setStudentForm({...studentForm, student_id: e.target.value})} fullWidth />
              <Input label="Course" value={studentForm.program} onChange={e => setStudentForm({...studentForm, program: e.target.value})} fullWidth />
              {!editingStudent && (
                <Input label="Password" type="password" value={studentForm.password} onChange={e => setStudentForm({...studentForm, password: e.target.value})} fullWidth />
              )}
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <Button onClick={handleSaveStudent} style={{ flex: 1 }}>Save</Button>
              <Button variant="ghost" onClick={() => setIsStudentModalOpen(false)} style={{ flex: 1 }}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {isAdminModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="custom-scrollbar" style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '0.5rem', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>{editingAdmin ? 'Edit Admin' : 'Add New Admin'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Input label="Full Name" value={adminForm.fullname} onChange={e => setAdminForm({...adminForm, fullname: e.target.value})} fullWidth />
              <Input label="Email" type="email" value={adminForm.email} onChange={e => setAdminForm({...adminForm, email: e.target.value})} fullWidth />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Role</label>
                <select value={adminForm.role} onChange={e => setAdminForm({...adminForm, role: e.target.value})} style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}>
                   <option value="Guidance Office">Guidance Office</option>
                   <option value="Ka-PEER Yu">Ka-PEER Yu</option>
                </select>
              </div>
              {!editingAdmin && (
                <>
                  <Input label="Password" type="password" value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} fullWidth />
                  <Input label="Confirm Password" type="password" value={adminForm.confirm_password} onChange={e => setAdminForm({...adminForm, confirm_password: e.target.value})} fullWidth />
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <Button onClick={handleSaveAdmin} style={{ flex: 1 }}>Save</Button>
              <Button variant="ghost" onClick={() => setIsAdminModalOpen(false)} style={{ flex: 1 }}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
