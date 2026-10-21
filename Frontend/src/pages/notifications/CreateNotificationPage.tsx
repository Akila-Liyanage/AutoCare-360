import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Check, Clock, X, ArrowLeft } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { getMyVehicles, type Vehicle } from '../../services/vehicleService';
import {
  createNotification,
  type CreateNotificationPayload
} from '../../services/notificationService';
import '../../styles/create-notification.css';

export type MessageType = 'Service reminder' | 'Other message' | 'System notice';
export type RecurrenceType = 'Once' | 'Weekly' | 'Monthly' | 'Every 5,000 km';
export type PriorityType = 'High' | 'Medium' | 'Low' | 'Critical';

export interface CreateNotificationFormState {
  messageType: MessageType;
  recipient: string;
  channels: string;
  title: string;
  message: string;
  date: string;
  time: string;
  recurrence: RecurrenceType;
  priority: PriorityType;
}

const INITIAL_FORM_STATE: CreateNotificationFormState = {
  messageType: 'Service reminder',
  recipient: 'Vehicle Owner',
  channels: 'Email + in-app',
  title: 'Periodic Vehicle Service Reminder',
  message:
    'A periodic maintenance service is due. Please review your service passport and book an inspection.',
  date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
  time: '09:00 AM',
  recurrence: 'Once',
  priority: 'High',
};

export const CreateNotificationPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateNotificationFormState>(INITIAL_FORM_STATE);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const loadVehicles = async () => {
      try {
        const myVehicles = await getMyVehicles();
        if (isMounted) {
          setVehicles(myVehicles);
          if (myVehicles.length > 0) {
            setSelectedVehicleId(myVehicles[0]._id);
          }
        }
      } catch {
        // Fallback gracefully
      }
    };

    loadVehicles();

    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTypeSelect = (type: MessageType) => {
    setFormData((prev) => ({
      ...prev,
      messageType: type,
    }));
  };

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(`Draft "${formData.title || 'Notification'}" saved successfully.`);
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('Please provide a message title.');
      return;
    }
    if (!formData.message.trim()) {
      showToast('Please provide a notification message.');
      return;
    }

    // Map priority to low/medium/high
    let priorityVal: 'low' | 'medium' | 'high' = 'medium';
    const p = (formData.priority || '').toLowerCase();
    if (p === 'high' || p === 'critical') {
      priorityVal = 'high';
    } else if (p === 'low') {
      priorityVal = 'low';
    }

    // Parse reminderDate
    let reminderDateVal: string | null = null;
    if (formData.date) {
      try {
        const parsed = new Date(formData.date);
        if (!isNaN(parsed.getTime())) {
          reminderDateVal = parsed.toISOString();
        }
      } catch {
        reminderDateVal = null;
      }
    }

    try {
      setIsSubmitting(true);
      const payload: CreateNotificationPayload = {
        vehicleId: selectedVehicleId || null,
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: formData.messageType,
        priority: priorityVal,
        reminderDate: reminderDateVal,
        dueDate: reminderDateVal,
      };

      await createNotification(payload);

      showToast(`Notification "${formData.title}" scheduled successfully.`);
      setTimeout(() => {
        navigate('/notifications');
      }, 1200);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to schedule notification. Please try again.';
      showToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeVehicle = useMemo(() => {
    return vehicles.find((v) => v._id === selectedVehicleId) || null;
  }, [vehicles, selectedVehicleId]);

  return (
    <div className="autocare-create-notif-page">
      <Navbar />

      <main className="autocare-create-notif-main">
        <div className="autocare-create-notif-container">
          {/* Back Navigation */}
          <div style={{ marginBottom: '14px' }}>
            <Link
              to="/notifications"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'transparent',
                border: 'none',
                color: '#0056A2',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'none',
                padding: '6px 12px',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Notifications</span>
            </Link>
          </div>

          {/* Header Row */}
          <div className="autocare-create-notif-header">
            <div className="autocare-create-notif-title-group">
              <h1 className="autocare-create-notif-title">Create a notification</h1>
              <p className="autocare-create-notif-subtitle">
                Schedule a reminder or operational message for an owner or workshop team.
              </p>
            </div>

            <div className="autocare-create-notif-actions">
              <button
                type="button"
                className="autocare-btn-save-draft"
                onClick={handleSaveDraft}
                disabled={isSubmitting}
              >
                Save draft
              </button>
              <button
                type="button"
                className="autocare-btn-schedule-submit"
                onClick={handleScheduleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Scheduling...' : 'Schedule notification'}
              </button>
            </div>
          </div>

          {/* Form and Preview Two-Column Grid */}
          <form className="autocare-create-notif-grid" onSubmit={handleScheduleSubmit}>
            {/* Left Column: Form Cards */}
            <div className="autocare-create-notif-left">
              {/* Card 1: Message type */}
              <div className="autocare-form-card">
                <h2 className="autocare-form-card-title">Message type</h2>
                <div
                  className="autocare-type-pills-row"
                  role="radiogroup"
                  aria-label="Message type selection"
                >
                  {(['Service reminder', 'Other message', 'System notice'] as MessageType[]).map(
                    (type) => (
                      <button
                        key={type}
                        type="button"
                        role="radio"
                        aria-checked={formData.messageType === type}
                        className={`autocare-type-pill ${
                          formData.messageType === type ? 'is-active' : ''
                        }`}
                        onClick={() => handleTypeSelect(type)}
                      >
                        {type}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Card 2: Recipient and channel */}
              <div className="autocare-form-card">
                <h2 className="autocare-form-card-title">Recipient and channel</h2>

                <div className="autocare-form-two-col">
                  <div>
                    <label htmlFor="recipient-input" className="autocare-form-label">
                      RECIPIENT
                    </label>
                    <input
                      id="recipient-input"
                      type="text"
                      name="recipient"
                      value={formData.recipient}
                      onChange={handleInputChange}
                      placeholder="Enter recipient name"
                      className="autocare-form-input"
                    />
                  </div>

                  <div>
                    <label htmlFor="channels-input" className="autocare-form-label">
                      CHANNELS
                    </label>
                    <input
                      id="channels-input"
                      type="text"
                      name="channels"
                      value={formData.channels}
                      onChange={handleInputChange}
                      placeholder="e.g. Email + in-app"
                      className="autocare-form-input"
                    />
                  </div>
                </div>

                <div className="autocare-form-group">
                  <label htmlFor="vehicle-select" className="autocare-form-label">
                    VEHICLE ASSOCIATION
                  </label>
                  <select
                    id="vehicle-select"
                    name="vehicleId"
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="autocare-form-select"
                  >
                    <option value="">No vehicle association (General notification)</option>
                    {vehicles.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.registrationNumber} · {v.manufacturer} {v.model}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Card 3: Message */}
              <div className="autocare-form-card">
                <h2 className="autocare-form-card-title">Message</h2>

                <div className="autocare-form-group">
                  <label htmlFor="title-input" className="autocare-form-label">
                    TITLE *
                  </label>
                  <input
                    id="title-input"
                    type="text"
                    required
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter notification title"
                    className="autocare-form-input"
                  />
                </div>

                <div className="autocare-form-group">
                  <label htmlFor="message-input" className="autocare-form-label">
                    MESSAGE *
                  </label>
                  <textarea
                    id="message-input"
                    required
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Write detailed notification instructions or details..."
                    className="autocare-form-textarea"
                  />
                </div>
              </div>

              {/* Card 4: Schedule */}
              <div className="autocare-form-card">
                <h2 className="autocare-form-card-title">Schedule</h2>

                <div className="autocare-schedule-grid">
                  <div>
                    <label htmlFor="date-input" className="autocare-form-label">
                      DATE
                    </label>
                    <input
                      id="date-input"
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="autocare-form-input"
                    />
                  </div>

                  <div>
                    <label htmlFor="time-input" className="autocare-form-label">
                      TIME
                    </label>
                    <input
                      id="time-input"
                      type="text"
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      placeholder="09:00 AM"
                      className="autocare-form-input"
                    />
                  </div>

                  <div>
                    <label htmlFor="recurrence-select" className="autocare-form-label">
                      RECURRENCE
                    </label>
                    <select
                      id="recurrence-select"
                      name="recurrence"
                      value={formData.recurrence}
                      onChange={handleInputChange}
                      className="autocare-form-select"
                    >
                      <option value="Once">Once</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Every 5,000 km">Every 5,000 km</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="priority-select" className="autocare-form-label">
                      PRIORITY
                    </label>
                    <select
                      id="priority-select"
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="autocare-form-select"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Delivery Preview & Delivery Readiness */}
            <div className="autocare-create-notif-right">
              {/* Delivery Preview Panel */}
              <div className="autocare-delivery-preview-card" aria-label="Delivery Preview">
                <h3 className="autocare-preview-heading">Delivery preview</h3>
                <span className="autocare-preview-type-badge">
                  {formData.messageType.toUpperCase()}
                </span>
                <h4 className="autocare-preview-title">
                  {formData.title || 'Your vehicle is due for service'}
                </h4>
                <p className="autocare-preview-time">
                  {formData.date || 'Upcoming'} · {formData.time || '09:00 AM'}
                </p>
                <p className="autocare-preview-channel">
                  {activeVehicle
                    ? `${activeVehicle.registrationNumber} · ${activeVehicle.manufacturer} ${activeVehicle.model}`
                    : formData.channels
                    ? formData.channels.replace('in-app', 'AutoCare app')
                    : 'Email + AutoCare app'}
                </p>
              </div>

              {/* Delivery Readiness Panel */}
              <div className="autocare-delivery-readiness-card" aria-label="Delivery Readiness">
                <h3 className="autocare-readiness-heading">Delivery readiness</h3>
                <div className="autocare-readiness-item">
                  <Check size={16} className="autocare-readiness-check-icon" />
                  <span>Recipient has verified account</span>
                </div>
                <div className="autocare-readiness-item">
                  <Check size={16} className="autocare-readiness-check-icon" />
                  <span>
                    {activeVehicle ? 'Vehicle linked' : 'General notification'}
                  </span>
                </div>
                <div className="autocare-readiness-item">
                  <Check size={16} className="autocare-readiness-check-icon" />
                  <span>Quiet hours respected</span>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="autocare-create-notif-toast" role="status">
          <Clock size={18} className="autocare-create-notif-toast-icon" />
          <span>{toastMessage}</span>
          <button
            type="button"
            className="autocare-create-notif-toast-close"
            onClick={() => setToastMessage(null)}
            aria-label="Dismiss toast"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default CreateNotificationPage;
