import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { MdAdd, MdEdit, MdDelete, MdClose, MdPerson } from 'react-icons/md';

const ROLES = ['Guidance Office', 'Ka-PEER Yu Support'];

interface Staff {
  id: number;
  fullname: string;
  email: string;
  role_title: string;
  is_primary: boolean;
}

const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};

const modalBox: React.CSSProperties = {
  background: '#fff', borderRadius: '16px', padding: '32px',
  width: '90%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
};

export default function ManageStaff() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModal, setIsDeleteModal] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null);
  const [form, setForm] = useState({ fullname: '', email: '', role: 'Ka-PEER Yu Support', password: '', confirm_password: '' });

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/admin/staff');
      setStaff(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStaff(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ fullname: '', email: '', role: 'Ka-PEER Yu Support', password: '', confirm_password: '' });
    setIsModalOpen(true);
  };

  const openEdit = (s: Staff) => {
    setEditing(s);
    setForm({ fullname: s.fullname, email: s.email, role: s.role_title, password: '', confirm_password: '' });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editing && form.password !== form.confirm_password) {
      return alert('Passwords do not match');
    }
    if (!form.fullname || !form.email) return alert('Full name and email are required');

    try {
      if (editing) {
        await axios.put(`/api/admin/staff/${editing.id}?requester_email=${user?.email}`, form);
      } else {
        await axios.post(`/api/admin/staff?requester_email=${user?.email}`, form);
      }
      setIsModalOpen(false);
      fetchStaff();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save staff');
    }
  };

  const confirmDelete = (s: Staff) => {
    setDeleteTarget(s);
    setIsDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`/api/admin/staff/${deleteTarget.id}?requester_email=${user?.email}`);
      setIsDeleteModal(false);
      fetchStaff();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete');
    }
  };

  const filtered = staff.filter(s =>
    s.fullname?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Manage Staff</h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px' }}>Add, edit, and manage staff accounts</p>
        </div>
        <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
          <MdAdd size={20} /> Add Staff
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <input
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', width: '100%', maxWidth: '400px', fontSize: '0.875rem', outline: 'none' }}
        />
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Staff Member', 'Email', 'Role', 'Actions'].map(h => (
                <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No staff accounts found.</td></tr>
            ) : filtered.map(s => (
              <tr key={s.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>
                      {(s.fullname || 'S')[0].toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{s.fullname || '—'}</span>
                  </div>
                </td>
                <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '0.875rem' }}>{s.email}</td>
                <td style={{ padding: '16px 20px' }}>
                  <span style={{ padding: '4px 12px', borderRadius: '999px', background: '#ede9fe', color: '#7c3aed', fontSize: '0.75rem', fontWeight: 600 }}>
                    {s.role_title}
                  </span>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => openEdit(s)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#f1f5f9', border: 'none', borderRadius: '6px', color: '#334155', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                      <MdEdit size={15} /> Edit
                    </button>
                    <button onClick={() => confirmDelete(s)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#fef2f2', border: 'none', borderRadius: '6px', color: '#dc2626', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                      <MdDelete size={15} /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                {editing ? 'Edit Staff Member' : 'Add New Staff'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <MdClose size={22} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Full Name', field: 'fullname', type: 'text' },
                { label: 'Email', field: 'email', type: 'email' },
              ].map(({ label, field, type }) => (
                <div key={field}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>{label}</label>
                  <input
                    type={type}
                    value={(form as any)[field]}
                    onChange={e => setForm({ ...form, [field]: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box' }}
                  />
                </div>
              ))}

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.875rem', background: '#fff' }}>
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>

              {!editing && (
                <>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Password</label>
                    <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Confirm Password</label>
                    <input type="password" value={form.confirm_password} onChange={e => setForm({ ...form, confirm_password: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
              <button onClick={handleSave} style={{ flex: 1, padding: '12px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
                {editing ? 'Save Changes' : 'Create Staff'}
              </button>
              <button onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#1e293b', border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {isDeleteModal && deleteTarget && (
        <div style={modalOverlay}>
          <div style={{ ...modalBox, maxWidth: '380px', textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, background: '#fef2f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <MdDelete size={28} color="#dc2626" />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>Delete Staff Member?</h3>
            <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: '0.875rem' }}>
              Are you sure you want to delete <strong>{deleteTarget.fullname}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setIsDeleteModal(false)} style={{ flex: 1, padding: '11px', background: '#f1f5f9', color: '#1e293b', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: '11px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
