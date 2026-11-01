import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Wrench,
  User,
  ArrowRight,
} from 'lucide-react';

export interface ServiceRecordDetailData {
  _id?: string;
  id?: string;
  vehicleRef?: string;
  regNumber?: string;
  vehicleModel?: string;
  vehicleTitle?: string;
  manufacturingYear?: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  date?: string;
  serviceDate?: string;
  status?: string;
  verificationStatus?: string;
  totalCost?: number;
  labourCost?: number;
  partsCost?: number;
  mileage?: number | string;
  rawMileage?: number;
  serviceType?: string;
  serviceDescription?: string;
  workPerformed?: string;
  partsReplaced?: string[] | string;
  technicianName?: string;
  garageName?: string;
  vehicleId?: string;
  serviceImages?: string[];
  invoiceUrl?: string;
}

interface ServiceRecordDetailsModalProps {
  record: ServiceRecordDetailData | null;
  onClose: () => void;
}

export const ServiceRecordDetailsModal: React.FC<ServiceRecordDetailsModalProps> = ({
  record,
  onClose,
}) => {
  const navigate = useNavigate();

  if (!record) return null;

  const reg = record.regNumber || (record.vehicleRef?.split(' ')[0]) || 'WP CAB-7890';
  const model = record.vehicleModel || record.vehicleTitle || 'Customer Vehicle';
  const owner = record.customerName || 'Chathura Perera';
  const serviceType = record.serviceType || record.serviceDescription || 'Periodic Maintenance';
  const work = record.workPerformed || 'Full inspection, synthetic engine oil change, and multi-point safety diagnostic.';
  
  let partsList: string[] = [];
  if (Array.isArray(record.partsReplaced)) {
    partsList = record.partsReplaced;
  } else if (typeof record.partsReplaced === 'string' && record.partsReplaced.trim()) {
    partsList = record.partsReplaced.split(',').map((p) => p.trim());
  }

  const rawCost = record.totalCost || 0;
  const isVerified = record.verificationStatus === 'verified' || record.status === 'Verified' || record.status === 'COMMITTED';
  const recordId = record._id || record.id || '2026-SE11-COMMITTED';

  const dateFormatted = record.date || (record.serviceDate ? new Date(record.serviceDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) : 'Recent');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 17, 40, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #DCE5EF',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#F8FAFC',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#0056A2',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Wrench size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#0A1128' }}>
                Service Record Details
              </h2>
              <span style={{ fontSize: '11.5px', color: '#64748B', fontFamily: 'monospace' }}>
                Hash: {recordId.slice(-10).toUpperCase()}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                background: isVerified ? '#DCFCE7' : '#FEF3C7',
                color: isVerified ? '#15803D' : '#B45309',
                padding: '3px 9px',
                borderRadius: '12px',
                fontSize: '11.5px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <CheckCircle2 size={13} />
              {isVerified ? 'VERIFIED & COMMITTED' : 'PENDING APPROVAL'}
            </span>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Vehicle & Owner Info Card */}
          <div
            style={{
              background: '#F1F5F9',
              borderRadius: '10px',
              padding: '14px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  fontSize: '14px',
                  color: '#0A1128',
                }}
              >
                {reg}
              </div>
              <div>
                <strong style={{ fontSize: '14px', color: '#0A1128', display: 'block' }}>
                  {model}
                </strong>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  Owner: {owner} {record.customerPhone ? `· ${record.customerPhone}` : ''}
                </span>
              </div>
            </div>

            {record.vehicleId && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(`/garage/vehicles/${record.vehicleId}`);
                }}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  color: '#0056A2',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>View Vehicle Passport</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>

          {/* 4 Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px' }}>
              <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', display: 'block' }}>
                Service Date
              </span>
              <strong style={{ fontSize: '13px', color: '#0A1128' }}>{dateFormatted}</strong>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px' }}>
              <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', display: 'block' }}>
                Odometer Reading
              </span>
              <strong style={{ fontSize: '13px', color: '#0A1128' }}>
                {typeof record.mileage === 'number' ? `${record.mileage.toLocaleString()} km` : record.mileage || '45,600 km'}
              </strong>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px' }}>
              <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', display: 'block' }}>
                Workshop Station
              </span>
              <strong style={{ fontSize: '13px', color: '#0A1128' }}>
                {record.garageName || 'Perera Auto Works'}
              </strong>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px' }}>
              <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', display: 'block' }}>
                Total Certified
              </span>
              <strong style={{ fontSize: '14px', color: '#0056A2', fontWeight: 800 }}>
                LKR {rawCost.toLocaleString()}
              </strong>
            </div>
          </div>

          {/* Service Details Section */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
              Maintenance Service
            </h3>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#0A1128', marginBottom: '8px' }}>
              {serviceType}
            </div>

            <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              Work Performed & Diagnostics:
            </span>
            <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#334155', lineHeight: '19px' }}>
              {work}
            </p>

            {/* Technician */}
            <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} style={{ color: '#0056A2' }} />
              <span>Certified Technician: <strong>{record.technicianName || 'Certified Workshop Technician'}</strong></span>
            </div>
          </div>

          {/* Parts Replaced */}
          {partsList.length > 0 && (
            <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', margin: '0 0 10px 0' }}>
                Parts Replaced & Components
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {partsList.map((part, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: '#F1F5F9',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '12px',
                      color: '#0A1128',
                      fontWeight: 500,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <CheckCircle2 size={13} style={{ color: '#15803D' }} />
                    {part}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Attached Documents & Service Photos */}
          {((record.serviceImages && record.serviceImages.length > 0) || record.invoiceUrl) && (
            <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', margin: '0 0 10px 0' }}>
                Service Photos & Verification Documents
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                {record.serviceImages?.map((img, idx) => (
                  <a
                    key={idx}
                    href={img.startsWith('http') ? img : `http://localhost:5000${img}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      overflow: 'hidden',
                      display: 'block',
                      background: '#F1F5F9',
                    }}
                    title="Click to view full photo"
                  >
                    <img
                      src={img.startsWith('http') ? img : `http://localhost:5000${img}`}
                      alt={`Service photo ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Photo';
                      }}
                    />
                  </a>
                ))}

                {record.invoiceUrl && (
                  <a
                    href={record.invoiceUrl.startsWith('http') ? record.invoiceUrl : `http://localhost:5000${record.invoiceUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1px solid #0056A2',
                      background: '#EFF6FF',
                      color: '#0056A2',
                      fontSize: '12px',
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    View Official Invoice / Document
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Ledger Proof Box */}
          <div
            style={{
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '10px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <ShieldCheck size={20} style={{ color: '#15803D', flexShrink: 0 }} />
            <div style={{ fontSize: '12px', color: '#166534', lineHeight: '17px' }}>
              <strong>Cryptographically Signed Ledger Entry.</strong> Published by accredited partner <strong>Perera Auto Works (BR-03)</strong>. Tamper-evident and permanently recorded to the vehicle digital passport.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 22px',
            borderTop: '1px solid #E2E8F0',
            background: '#F8FAFC',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            borderBottomLeftRadius: '16px',
            borderBottomRightRadius: '16px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#0056A2',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 20px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceRecordDetailsModal;
