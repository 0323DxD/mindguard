import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { AnimatedItem } from '../components/AnimatedItem';
import styles from './Auth.module.css';

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { signup, startAnonymous } = useAuth();

  const handleGuestLogin = () => {
    startAnonymous();
    navigate('/dashboard');
  };

  const [formData, setFormData] = useState({
    fullname: '',
    studentid: '',
    program: '',   // kept as 'program' to match User type; displayed as "Course"
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [contacts, setContacts] = useState<string[]>(['']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Custom Dropdown State
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCourseDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleContactChange = (index: number, value: string) => {
    const updated = [...contacts];
    updated[index] = value;
    setContacts(updated);
  };

  const addContact = () => {
    if (contacts.length < 3) setContacts([...contacts, '']);
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    const validContacts = contacts.filter((c) => c.trim() !== '');
    if (validContacts.length === 0) {
      setError('At least one trusted contact is required.');
      return;
    }

    if (!formData.program) {
       setError('Please select a course');
       return;
    }

    const phoneRegex = /^\+?[0-9\s-]+$/;
    for (const contact of validContacts) {
      if (!phoneRegex.test(contact)) {
        setError(`Invalid phone format: ${contact}. Use numbers like +639...`);
        return;
      }
    }

    setIsLoading(true);
    try {
      await signup(
        {
          fullname: formData.fullname,
          studentid: formData.studentid,
          program: formData.program,
          email: formData.email,
        },
        formData.password
      );
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.gridWrapper}>

        {/* ── Desktop Branding Side ── */}
        <div className={styles.brandSide}>
          <div 
            onClick={() => navigate('/')}
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              cursor: 'pointer',
              padding: '0.5rem',
              color: '#00695c',
              fontSize: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              fontWeight: 600,
              gap: '4px'
            }}
            title="Back"
          >
            ← Back
          </div>
          <img
            src="/minguard-logo.png"
            alt="MindGuard – Empathetic AI & Crisis Support"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <h1 className={styles.brandTitle}>MindGuard</h1>
          <p className={styles.brandTagline}>Your Safe Space</p>
        </div>

        {/* ── Form Side ── */}
        <div className={styles.formSide}>
        
        {/* ── Mobile Branding Header (Hidden on Desktop) ── */}
        <div className={`${styles.brandHeader} ${styles.mobileBrandHeader}`} style={{ position: 'relative' }}>
          {/* Subtle Back Button */}
          <div 
            onClick={() => navigate('/')}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              cursor: 'pointer',
              padding: '0.5rem',
              color: '#4b5563',
              fontSize: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Back"
          >
            ←
          </div>
          <img
            src="/minguard-logo.png"
            alt="MindGuard Logo"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <h1>Create Account</h1>
          <p>Join MindGuard today</p>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} noValidate aria-label="Sign up form">
          
          <div className={styles.formRow}>
            <div className={styles.field}>
              <Input label="Full Name" name="fullname" id="fullname"
                value={formData.fullname} onChange={handleChange}
                placeholder="Juan Dela Cruz" required fullWidth
                aria-required="true" />
            </div>

            <div className={styles.field}>
              <Input label="Student ID" name="studentid" id="studentid"
                value={formData.studentid} onChange={handleChange}
                placeholder="2021001234" required fullWidth
                aria-required="true" />
            </div>
          </div>

          <div className={styles.field} style={{ marginBottom: '1.5rem', position: 'relative' }} ref={dropdownRef}>
            <label id="course-label" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
              Course <span style={{ color: '#ef4444' }}>*</span>
            </label>
            
            {/* Custom Select Trigger */}
            <div 
              tabIndex={0}
              role="button"
              aria-haspopup="listbox"
              aria-expanded={isCourseDropdownOpen}
              aria-labelledby="course-label"
              onClick={() => setIsCourseDropdownOpen(!isCourseDropdownOpen)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsCourseDropdownOpen(!isCourseDropdownOpen);
                }
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                backgroundColor: '#fff',
                fontSize: '0.875rem',
                color: formData.program ? '#111827' : '#9ca3af',
                outline: 'none',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                 {formData.program || 'Select your LSPU course'}
              </span>
              <span style={{ fontSize: '0.75rem', transform: isCourseDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                 ▼
              </span>
            </div>

            {/* Custom Dropdown Menu */}
            {isCourseDropdownOpen && (
              <div 
                className="custom-scrollbar"
                role="listbox"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  width: '100%',
                  maxHeight: '300px', // Strict mobile height to enable scrolling
                  overflowY: 'auto',
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  marginTop: '0.25rem',
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {[
                  {
                    group: "COLLEGE OF ARTS AND SCIENCES (CAS)",
                    options: [
                      { val: "BSBio", label: "Bachelor of Science in Biology (BSBio)" },
                      { val: "BSPsych", label: "Bachelor of Science in Psychology (BSPsych)" }
                    ]
                  },
                  {
                    group: "COLLEGE OF BUSINESS ADMINISTRATION AND ACCOUNTANCY (CBAA)",
                    options: [
                      { val: "BSOA", label: "Bachelor of Science in Office Administration (BSOA)" },
                      { val: "BSBA-FM", label: "Bachelor of Science in Business Administration (BSBA) - Major in Financial Management" },
                      { val: "BSBA-MM", label: "Bachelor of Science in Business Administration (BSBA) - Major in Marketing Management" },
                      { val: "BSA", label: "Bachelor of Science in Accountancy (BSA)" }
                    ]
                  },
                  {
                    group: "COLLEGE OF COMPUTER STUDIES (CCS)",
                    options: [
                      { val: "BSIT", label: "Bachelor of Science in Information Technology (BSInfoTech)" },
                      { val: "BSCS", label: "Bachelor of Science in Computer Science (BSCS)" }
                    ]
                  },
                  {
                    group: "COLLEGE OF CRIMINAL JUSTICE EDUCATION (CCJE)",
                    options: [
                      { val: "BSCrim", label: "Bachelor of Science in Criminology (BSCrim)" }
                    ]
                  },
                  {
                    group: "COLLEGE OF ENGINEERING (COE)",
                    options: [
                      { val: "BSCpE", label: "Bachelor of Science in Computer Engineering (BSCpE)" },
                      { val: "BSEE", label: "Bachelor of Science in Electrical Engineering (BSEE)" },
                      { val: "BSECE", label: "Bachelor of Science in Electronics Engineering (BSECE)" }
                    ]
                  },
                  {
                    group: "COLLEGE OF INDUSTRIAL TECHNOLOGY (CIT)",
                    options: [
                      { val: "BSIT-AT", label: "Bachelor of Science in Industrial Technology (BSIT) - Automotive Technology (AT)" },
                      { val: "BSIT-ADT", label: "Bachelor of Science in Industrial Technology (BSIT) - Architectural Drafting (ADT)" },
                      { val: "BSIT-ELT", label: "Bachelor of Science in Industrial Technology (BSIT) - Electrical Technology (ELT)" },
                      { val: "BSIT-ELX", label: "Bachelor of Science in Industrial Technology (BSIT) - Electronics Technology (ELX)" },
                      { val: "BSIT-FBPSM", label: "Bachelor of Science in Industrial Technology (BSIT) - Food & Beverage Preparation and Service Management (FBPSM)" },
                      { val: "BSIT-HVACR", label: "Bachelor of Science in Industrial Technology (BSIT) - Heating, Ventilating, Air-Conditioning and Refrigeration (HVACR)" }
                    ]
                  },
                  {
                    group: "COLLEGE OF INTERNATIONAL HOSPITALITY AND TOURISM MANAGEMENT (CIHTM)",
                    options: [
                      { val: "BSHM", label: "Bachelor of Science in Hospitality Management (BSHM)" },
                      { val: "BSTM", label: "Bachelor of Science in Tourism Management (BSTM)" }
                    ]
                  },
                  {
                    group: "COLLEGE OF TEACHER EDUCATION (CTE)",
                    options: [
                      { val: "BSEd-English", label: "Bachelor of Secondary Education (BSEd) - English" },
                      { val: "BSEd-Filipino", label: "Bachelor of Secondary Education (BSEd) - Filipino" },
                      { val: "BSEd-Math", label: "Bachelor of Secondary Education (BSEd) - Mathematics" },
                      { val: "BSEd-Science", label: "Bachelor of Secondary Education (BSEd) - Science" },
                      { val: "BSEd-SocialScience", label: "Bachelor of Secondary Education (BSEd) - Social Science" },
                      { val: "BEEd", label: "Bachelor of Elementary Education (BEEd)" },
                      { val: "BPEd", label: "Bachelor of Physical Education (BPEd)" },
                      { val: "BTLEd-HE", label: "Bachelor of Technology and Livelihood Education (BTLEd) - Home Economics (BTLEd-HE)" },
                      { val: "BTLEd-IA", label: "Bachelor of Technology and Livelihood Education (BTLEd) - Industrial Arts (BTLEd-IA)" },
                      { val: "BTVTEd-ELT", label: "Bachelor of Technical Vocational Teacher Education (BTVTEd) - Electrical Technology (BTVTEd-ELT)" },
                      { val: "BTVTEd-ELTS", label: "Bachelor of Technical Vocational Teacher Education (BTVTEd) - Electronics Technology (BTVTEd-ELTS)" },
                      { val: "BTVTEd-FSM", label: "Bachelor of Technical Vocational Teacher Education (BTVTEd) - Food & Service Management (BTVTEd-FSM)" },
                      { val: "BTVTEd-GFD", label: "Bachelor of Technical Vocational Teacher Education (BTVTEd) - Garments, Fashion & Design (BTVTEd-GFD)" }
                    ]
                  }
                ].map((category, i) => (
                  <div key={i}>
                    {/* Category Header */}
                    <div style={{
                      padding: '0.75rem 1rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#4b5563',
                      backgroundColor: '#f9fafb',
                      borderBottom: '1px solid #f3f4f6',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {category.group}
                    </div>
                    {/* Options */}
                    {category.options.map((opt, idx) => (
                      <AnimatedItem key={opt.val} delay={0.05 * idx}>
                        <div 
                          role="option"
                          aria-selected={formData.program === opt.label}
                          tabIndex={0}
                          onClick={() => {
                            setFormData({ ...formData, program: opt.label });
                            setIsCourseDropdownOpen(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setFormData({ ...formData, program: opt.label });
                              setIsCourseDropdownOpen(false);
                            }
                          }}
                          style={{
                            padding: '0.75rem 1rem 0.75rem 1.5rem', // Indented
                            fontSize: '0.875rem',
                            color: formData.program === opt.label ? '#0f766e' : '#1f2937',
                            backgroundColor: formData.program === opt.label ? '#f0fdfa' : 'transparent',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease'
                          }}
                          onMouseEnter={(e) => { if (formData.program !== opt.label) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                          onMouseLeave={(e) => { if (formData.program !== opt.label) e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          {opt.label}
                        </div>
                      </AnimatedItem>
                    ))}
                  </div>
                ))}
              </div>
            )}
            
            {/* Hidden native input for valid form submissions / requirement */}
            <input type="text" name="program" value={formData.program} required readOnly style={{ opacity: 0, position: 'absolute', height: 0, width: 0, padding: 0, margin: 0, border: 0 }} tabIndex={-1} />

            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.5rem' }}>Select your LSPU course from the list.</p>
          </div>

          <div className={styles.field}>
            <Input label="Email" name="email" id="email" type="email"
              value={formData.email} onChange={handleChange}
              placeholder="email@lspu.edu.ph" required fullWidth
              aria-required="true" />
          </div>

          <div className={styles.formRow}>
            <div className={styles.field}>
              <Input label="Password" name="password" id="password" type="password"
                value={formData.password} onChange={handleChange}
                placeholder="Min. 8 characters" required fullWidth
                aria-required="true" aria-describedby="passwordHint" />
              <span id="passwordHint" className={styles.hint}>
                At least 8 characters
              </span>
            </div>

            <div className={styles.field}>
              <Input label="Confirm Password" name="confirmPassword" id="confirmPassword"
                type="password" value={formData.confirmPassword}
                onChange={handleChange} placeholder="Re-enter password"
                required fullWidth aria-required="true" />
            </div>
          </div>

          {/* ── Trusted Contacts ── */}
          <div className={styles.sectionTitle} id="contactsLabel">
            Trusted Contacts (Emergency){' '}
            <span className={styles.required} aria-label="required">*</span>
          </div>
          <p className={styles.helperText} id="contactsHelper">
            These contacts may be notified in emergencies to ensure your safety.
          </p>

          {contacts.map((contact, index) => (
            <div key={index} className={styles.contactRow}>
              <Input
                label={`Contact Number ${index + 1}`}
                name={`contact-${index}`}
                id={`contact-${index}`}
                value={contact}
                onChange={(e) => handleContactChange(index, e.target.value)}
                placeholder="+63 900 000 0000"
                fullWidth
                aria-describedby="contactsHelper"
              />
              {index > 0 && (
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeContact(index)}
                  aria-label={`Remove contact ${index + 1}`}
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          {contacts.length < 3 && (
            <button type="button" className={styles.addBtn} onClick={addContact}>
              + Add Another Trusted Contact
            </button>
          )}

          {error && (
            <div className={styles.error} role="alert" aria-live="assertive">
              {error}
            </div>
          )}

          {/* ── Sign Up button ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className={styles.submitBtn}
            >
              Sign Up
            </Button>

            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleGuestLogin}
              style={{ padding: '0.75rem' }}
            >
              Continue as Guest
            </Button>
          </div>

          {/* ── Footer links — inside form flow, right after button ── */}
          <div className={styles.footer}>
            <p>
              Already have an account?{' '}
              <span
                className={styles.link}
                onClick={() => navigate('/login')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate('/login')}
              >
                Log In
              </span>
            </p>
            <p>
              <span
                className={styles.link}
                onClick={() => navigate('/')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate('/')}
              >
                Back to Home
              </span>
            </p>
          </div>

        </form>

        {/* ── Security notice ── */}
        <div className={styles.securityNotice}>
          🔒 All data is encrypted and protected for your privacy.
        </div>

        </div>
      </div>
    </div>
  );
};
