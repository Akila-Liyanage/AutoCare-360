import React, { useState } from 'react';
import { Check, Clock, X } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import '../../styles/create-notification.css';

export type MessageType = 'Service reminder' | 'Other message' | 'System notice';
export type RecurrenceType = 'Once' | 'Weekly' | 'Monthly' | 'Every 5,000 km';
export type PriorityType = 'High' | 'Medium' | 'Low' | 'Critical';

export interface CreateNotificationFormState {
  messageType: MessageType;
  recipient: string;
  channels: string;
  vehicleAssociation: string;
  title: string;
  message: string;
  date: string;
  time: string;
  recurrence: RecurrenceType;
  priority: PriorityType;
}

const INITIAL_FORM_STATE: CreateNotificationFormState = {
  messageType: 'Service reminder',
  recipient: 'Kaveesha P.',
  channels: 'Email + in-app',
  vehicleAssociation: 'WP ABC-1234 · Toyota Aqua',
  title: 'Your Toyota Aqua is due for service',
  message:
    'A periodic engine service is due at 86,000 km. Book with Perera Auto Works to keep your verified history current.',
  date: '24 Sep 2026',
  time: '09:00 AM',
  recurrence: 'Once',
  priority: 'High',
};

export const CreateNotificationPage: React.FC = () => {
  const [formData, setFormData] = useState<CreateNotificationFormState>(INITIAL_FORM_STATE);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('Please provide a message title.');
      return;
    }
    showToast(
      `Notification scheduled successfully for delivery on ${formData.date} at ${formData.time}.`
    );
  };

  return (
    <div className="autocare-create-notif-page">
      <Navbar />

      <main className="autocare-create-notif-main">
        <div className="autocare-create-notif-container">
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
              >
                Save draft
              </button>
              <button
                type="button"
                className="autocare-btn-schedule-submit"
                onClick={handleScheduleSubmit}
              >
                Schedule notification
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
                  <label htmlFor="vehicle-input" className="autocare-form-label">
                    VEHICLE ASSOCIATION
                  </label>
                  <input
                    id="vehicle-input"
                    type="text"
                    name="vehicleAssociation"
                    value={formData.vehicleAssociation}
                    onChange={handleInputChange}
                    placeholder="WP ABC-1234 · Toyota Aqua"
                    className="autocare-form-input"
                  />
                </div>
              </div>

              {/* Card 3: Message */}
              <div className="autocare-form-card">
                <h2 className="autocare-form-card-title">Message</h2>

                <div className="autocare-form-group">
                  <label htmlFor="title-input" className="autocare-form-label">
                    TITLE
                  </label>
                  <input
                    id="title-input"
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter notification title"
                    className="autocare-form-input"
                  />
                </div>

                <div className="autocare-form-group">
                  <label htmlFor="message-input" className="autocare-form-label">
                    MESSAGE
                  </label>
                  <textarea
                    id="message-input"
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
                      type="text"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      placeholder="24 Sep 2026"
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
                  {formData.title || 'Your Toyota Aqua is due for service'}
                </h4>
                <p className="autocare-preview-time">
                  {formData.date || '24 Sep 2026'} · {formData.time || '09:00 AM'}
                </p>
                <p className="autocare-preview-channel">
                  {formData.channels
                    ? formData.channels.replace('in-app', 'AutoCare app')
                    : 'Email + AutoCare app'}
                </p>
              </div>

              {/* Delivery Readiness Panel */}
              <div className="autocare-delivery-readiness-card" aria-label="Delivery Readiness">
                <h3 className="autocare-readiness-heading">Delivery readiness</h3>
                <div className="autocare-readiness-item">
                  <Check size={16} className="autocare-readiness-check-icon" />
                  <span>Recipient has verified email</span>
                </div>
                <div className="autocare-readiness-item">
                  <Check size={16} className="autocare-readiness-check-icon" />
                  <span>Vehicle is linked</span>
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
