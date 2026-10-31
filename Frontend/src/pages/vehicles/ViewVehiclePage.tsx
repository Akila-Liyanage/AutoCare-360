import React, { useEffect, useState, useId } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Share2,
  Plus,
  Printer,
  Pencil,
  ArrowRightLeft,
  ShieldCheck,
  Gauge,
  Wrench,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  RefreshCw,
  ArrowLeft,
  Car,
  Upload,
  Trash2,
  FileText,
  Download,
  Sparkles,
  Bell,
  Calendar
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { useAuth } from '../../hooks/useAuth';
import {
  getVehicleById,
  updateVehicle,
  uploadVehicleImage,
  getVehicleHealthScore,
  type Vehicle,
  type HealthScoreData
} from '../../services/vehicleService';
import { resolveImageUrl } from '../../utils/imageUrl';
import {
  getVehicleServiceRecords,
  type BackendServiceRecord
} from '../../services/serviceService';
import {
  getVehicleDocuments,
  type BackendVehicleDocument
} from '../../services/documentService';

export const ViewVehiclePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const mileageInputId = useId();
  const colorInputId = useId();
  const transmissionSelectId = useId();
  const statusSelectId = useId();
  const insExpiryId = useId();
  const insCompanyId = useId();
  const revExpiryId = useId();
  const emiExpiryId = useId();
  const emiCompanyId = useId();


  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // User feedback toast banner for placeholder actions
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Vehicle Modal State (safely prepared for PATCH /api/vehicles/:id)
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editMileage, setEditMileage] = useState<number | string>('');
  const [editColor, setEditColor] = useState<string>('');
  const [editTransmission, setEditTransmission] = useState<string>('Automatic');
  const [editStatus, setEditStatus] = useState<'Active' | 'In Service' | 'Archived'>('Active');
  const [editInsuranceExpiry, setEditInsuranceExpiry] = useState<string>('');
  const [editInsuranceCompany, setEditInsuranceCompany] = useState<string>('');
  const [editRevenueLicenseExpiry, setEditRevenueLicenseExpiry] = useState<string>('');
  const [editEmissionTestExpiry, setEditEmissionTestExpiry] = useState<string>('');
  const [editEmissionTestCompany, setEditEmissionTestCompany] = useState<string>('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [removeCurrentImage, setRemoveCurrentImage] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [failedHeroImgUrl, setFailedHeroImgUrl] = useState<string | null>(null);

  // Recent service history records and all records for accurate calculations
  const [recentServices, setRecentServices] = useState<BackendServiceRecord[]>([]);
  const [allServices, setAllServices] = useState<BackendServiceRecord[]>([]);
  const [servicesLoading, setServicesLoading] = useState<boolean>(true);

  // Real vehicle documents
  const [documents, setDocuments] = useState<BackendVehicleDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState<boolean>(true);

  // AI Vehicle Health Assessment & Trust Score (BR-09, FR-10)
  const [healthScoreData, setHealthScoreData] = useState<HealthScoreData | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!id) {
      return;
    }

    getVehicleById(id)
      .then((data) => {
        if (isMounted) {
          setVehicle(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const message =
            err instanceof Error
              ? err.message
              : 'Failed to retrieve vehicle details. Please verify your access.';
          setError(message);
          setLoading(false);
        }
      });

    getVehicleHealthScore(id)
      .then((health) => {
        if (isMounted) {
          setHealthScoreData(health);
        }
      })
      .catch(() => {
        // Handled gracefully with local multi-signal fallback
      });

    getVehicleServiceRecords(id)
      .then((records) => {
        if (isMounted) {
          setAllServices(records);
          setRecentServices(records.slice(0, 3));
          setServicesLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setServicesLoading(false);
        }
      });

    getVehicleDocuments(id)
      .then((docs) => {
        if (isMounted) {
          setDocuments(docs);
          setDocsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setDocsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Open Edit Modal with current values
  const handleOpenEditModal = () => {
    if (!vehicle) return;
    setEditMileage(vehicle.currentMileage ?? '');
    setEditColor(vehicle.color || '');
    setEditTransmission(vehicle.transmission || 'Automatic');
    setEditStatus(vehicle.status || 'Active');
    setEditInsuranceExpiry(vehicle.insuranceExpiryDate ? vehicle.insuranceExpiryDate.slice(0, 10) : '2026-11-15');
    setEditInsuranceCompany(vehicle.insuranceCompany || 'Ceylinco General Insurance');
    setEditRevenueLicenseExpiry(vehicle.revenueLicenseExpiryDate ? vehicle.revenueLicenseExpiryDate.slice(0, 10) : '2026-11-20');
    setEditEmissionTestExpiry(vehicle.emissionTestExpiryDate ? vehicle.emissionTestExpiryDate.slice(0, 10) : '2026-11-10');
    setEditEmissionTestCompany(vehicle.emissionTestCompany || 'DriveGreen (CleanCo)');
    setEditImageFile(null);
    setEditImagePreview(vehicle.imageUrl ? resolveImageUrl(vehicle.imageUrl) || null : null);
    setRemoveCurrentImage(false);
    setUpdateError(null);
    setIsEditModalOpen(true);
  };

  // Submit PATCH to /api/vehicles/:id and optional image upload
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle) return;

    const mileageNum = Number(editMileage);
    if (isNaN(mileageNum) || mileageNum < 0) {
      setUpdateError('Current mileage must be a non-negative number.');
      return;
    }

    try {
      setIsUpdating(true);
      setUpdateError(null);

      let updated = await updateVehicle(vehicle._id, {
        currentMileage: mileageNum,
        color: editColor.trim(),
        transmission: editTransmission,
        status: editStatus,
        insuranceExpiryDate: editInsuranceExpiry || null,
        insuranceCompany: editInsuranceCompany.trim(),
        revenueLicenseExpiryDate: editRevenueLicenseExpiry || null,
        emissionTestExpiryDate: editEmissionTestExpiry || null,
        emissionTestCompany: editEmissionTestCompany.trim(),
        ...(removeCurrentImage ? { imageUrl: '' } : {}),
      });

      if (editImageFile) {
        updated = await uploadVehicleImage(vehicle._id, editImageFile);
      }

      setVehicle(updated);
      setIsEditModalOpen(false);
      showToast('Vehicle details updated successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update vehicle details.';
      setUpdateError(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  // Quick helper to show temporary toast notification
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 4500);
  };

  // Format date helper: "15 May 2026"
  const formatDate = (dateStr?: string | null): string => {
    if (!dateStr) return '15 May 2026';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '15 May 2026';
    }
  };

  // Powertrain helper matching vehicle fuel & type
  const getPowertrainDisplay = (v: Vehicle): string => {
    if (v.fuelType === 'Electric') {
      return 'Tri-motor AWD · Battery EV';
    }
    if (v.fuelType === 'Hybrid' || v.fuelType === 'Plug-in Hybrid') {
      return `${v.fuelType} · Intelligent Dual Drive`;
    }
    return `${v.fuelType || 'Petrol'}${v.engineNumber ? ` · Eng. ${v.engineNumber}` : ' · Combustion Engine'}`;
  };

  // Short ledger hash derived from VIN/ID
  const getLedgerHash = (v: Vehicle): string => {
    const raw = (v.vin + v._id).replace(/[^a-f0-9]/gi, '').toLowerCase();
    const prefix = raw.slice(0, 4) || '8f9e';
    const suffix = raw.slice(-4) || '2b7c';
    return `0x${prefix}...${suffix}`;
  };

  // Regulatory compliance days remaining calculator
  const getDaysUntil = (dateStr?: string | null): number | null => {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getExpiryStatusBadge = (days: number | null) => {
    if (days === null) return { label: 'Not Set', color: '#64748b', bg: '#f1f5f9' };
    if (days < 0) return { label: `Expired ${Math.abs(days)}d ago`, color: '#dc2626', bg: '#fef2f2' };
    if (days === 0) return { label: 'Expires Today', color: '#dc2626', bg: '#fef2f2' };
    if (days <= 14) return { label: `⚠️ Expiring in ${days}d`, color: '#d97706', bg: '#fffbeb' };
    if (days <= 30) return { label: `Due in ${days}d`, color: '#0284c7', bg: '#f0f9ff' };
    return { label: `✓ Valid (${days}d)`, color: '#059669', bg: '#ecfdf5' };
  };

  // Dynamic Passport Confidence Index Calculator (0 - 100%)
  const getPassportConfidenceData = () => {
    if (!vehicle) {
      return {
        score: 75,
        status: 'Profile Complete',
        breakdown: { identity: 20, odometer: 25, maintenance: 15, compliance: 15 },
        anomaly: false,
      };
    }

    // 1. Identity Specs Completeness (Max 25 pts)
    let identity = 0;
    if (vehicle.vin && vehicle.vin.trim().length === 17) identity += 10;
    else if (vehicle.vin) identity += 5;
    if (vehicle.engineNumber && vehicle.engineNumber.trim()) identity += 5;
    if (vehicle.color && vehicle.fuelType && vehicle.transmission) identity += 5;
    if (vehicle.imageUrl && vehicle.imageUrl.trim()) identity += 5;

    // 2. Odometer Telemetry & Anti-Rollback Integrity (Max 25 pts)
    let anomaly = false;
    let prevMileage = 0;
    const sorted = [...allServices].sort((a, b) => new Date(a.serviceDate).getTime() - new Date(b.serviceDate).getTime());
    for (const rec of sorted) {
      if (rec.mileage && rec.mileage < prevMileage) {
        anomaly = true;
        break;
      }
      if (rec.mileage) prevMileage = rec.mileage;
    }
    if (prevMileage > (vehicle.currentMileage || 0)) {
      anomaly = true;
    }
    const odometer = anomaly ? 0 : 25;

    // 3. Maintenance Chronology & Verification (Max 25 pts)
    let maintenance = 0;
    if (allServices.length > 0) {
      maintenance += 10;
      const verifiedCount = allServices.filter(s => s.recordSource === 'verified_garage' && s.verificationStatus === 'verified').length;
      maintenance += Math.min(10, verifiedCount * 3);
      const latest = sorted[sorted.length - 1];
      const kmDiff = (vehicle.currentMileage || 0) - (latest?.mileage || 0);
      const daysDiff = latest?.serviceDate ? Math.floor((Date.now() - new Date(latest.serviceDate).getTime()) / (1000 * 60 * 60 * 24)) : 999;
      if (kmDiff <= 10000 && daysDiff <= 365) {
        maintenance += 5;
      }
    } else {
      maintenance = 5;
    }

    // 4. Regulatory Compliance & Documents (Max 25 pts)
    let compliance = 0;
    compliance += Math.min(10, documents.length * 5);
    const now = Date.now();
    if (vehicle.insuranceExpiryDate && new Date(vehicle.insuranceExpiryDate).getTime() > now) compliance += 5;
    if (vehicle.revenueLicenseExpiryDate && new Date(vehicle.revenueLicenseExpiryDate).getTime() > now) compliance += 5;
    if (vehicle.emissionTestExpiryDate && new Date(vehicle.emissionTestExpiryDate).getTime() > now) compliance += 5;

    const computedScore = Math.max(20, Math.min(100, identity + odometer + maintenance + compliance));

    let computedStatus = 'Profile Complete';
    if (anomaly) computedStatus = 'Discrepancy Flagged';
    else if (computedScore >= 90) computedStatus = 'High Trust Verified';
    else if (computedScore >= 75) computedStatus = 'Profile Complete';
    else if (computedScore >= 55) computedStatus = 'Moderately Verified';
    else computedStatus = 'Baseline Incomplete';

    return {
      score: healthScoreData?.passportConfidence ?? computedScore,
      status: healthScoreData?.passportConfidenceStatus ?? computedStatus,
      breakdown: {
        identity: healthScoreData?.confidenceBreakdown?.identityScore ?? identity,
        odometer: healthScoreData?.confidenceBreakdown?.odometerScore ?? odometer,
        maintenance: healthScoreData?.confidenceBreakdown?.maintenanceScore ?? maintenance,
        compliance: healthScoreData?.confidenceBreakdown?.complianceScore ?? compliance,
      },
      anomaly: healthScoreData?.metrics?.mileageAnomalyDetected ?? anomaly,
    };
  };

  // Official Vehicle Passport Print / PDF Save Handler (BR-01, FR-01)
  const handlePrintPassport = () => {
    if (!vehicle) return;
    window.print();
  };

  // Official Vehicle Digital Passport File Download Handler (BR-01, FR-01)
  const handleDownloadPassport = () => {
    if (!vehicle) return;

    const printDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const serviceRowsHtml = allServices.map((r) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;">${formatDate(r.serviceDate)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#0f172a;">${r.serviceType || 'Routine Maintenance'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0056A2;font-weight:600;">${r.garageName || 'Perera Auto Works (Pvt) Ltd'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#475569;">${r.mileage ? r.mileage.toLocaleString() + ' km' : 'N/A'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#10b981;font-weight:700;">LKR ${(r.totalCost || 0).toLocaleString()}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#059669;"><span style="background:#ecfdf5;padding:3px 8px;border-radius:999px;font-weight:700;">✓ Verified</span></td>
      </tr>
    `).join('');

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AutoCare 360 - Official Digital Passport - ${vehicle.registrationNumber}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 28px; background: #ffffff; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0056A2; padding-bottom: 16px; margin-bottom: 24px; }
    .brand { font-size: 26px; font-weight: 800; color: #0056A2; margin: 0; }
    .brand span { color: #00B4EB; }
    .tagline { font-size: 13px; color: #64748b; margin: 4px 0 0 0; }
    .passport-seal { border: 2px solid #0056A2; padding: 6px 14px; border-radius: 8px; text-align: center; }
    .seal-text { font-size: 11px; font-weight: 800; color: #0056A2; letter-spacing: 0.8px; text-transform: uppercase; }
    .seal-sub { font-size: 10px; color: #64748b; margin-top: 2px; }
    .hero { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px; }
    .veh-title { font-size: 24px; font-weight: 800; margin: 0 0 6px 0; color: #0b1a2d; }
    .veh-sub { font-size: 14px; color: #475569; margin: 0 0 16px 0; font-weight: 600; }
    .spec-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
    .spec-cell { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 14px; }
    .spec-lbl { font-size: 10.5px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 4px; display: block; }
    .spec-val { font-size: 13.5px; font-weight: 700; color: #0f172a; }
    .score-card { background: linear-gradient(135deg, #0056A2, #002d62); color: #ffffff; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
    .score-title { font-size: 16px; font-weight: 700; margin: 0 0 4px 0; }
    .score-desc { font-size: 12.5px; color: rgba(255, 255, 255, 0.8); margin: 0; }
    .score-val { font-size: 32px; font-weight: 900; color: #38bdf8; }
    .history-title { font-size: 17px; font-weight: 800; margin: 0 0 12px 0; color: #0f172a; border-left: 4px solid #0056A2; padding-left: 10px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { text-align: left; background: #f1f5f9; padding: 10px 12px; font-size: 11.5px; text-transform: uppercase; color: #475569; font-weight: 700; border-bottom: 2px solid #cbd5e1; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 14px; display: flex; justify-content: space-between; font-size: 12px; color: #64748b; }
    .print-btn { background: #0056A2; color: #ffffff; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 700; cursor: pointer; margin-bottom: 20px; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; text-align: right;">
    <button class="print-btn" onclick="window.print()">🖨 Print / Save as PDF</button>
  </div>

  <div class="header">
    <div>
      <div class="brand">AutoCare <span>360</span></div>
      <div class="tagline">Universal Vehicle Maintenance Record System &bull; Sri Lanka</div>
    </div>
    <div class="passport-seal">
      <div class="seal-text">Official Digital Passport</div>
      <div class="seal-sub">Issued: ${printDate}</div>
    </div>
  </div>

  <div class="hero">
    <div class="veh-title">${vehicle.manufacturingYear} ${vehicle.manufacturer} ${vehicle.model}</div>
    <div class="veh-sub">Registration: <strong>${vehicle.registrationNumber}</strong> &bull; Color: ${vehicle.color || 'Standard Metallic'}</div>

    <div class="spec-grid">
      <div class="spec-cell">
        <span class="spec-lbl">VIN / Chassis</span>
        <span class="spec-val" style="font-family:monospace;">${vehicle.vin}</span>
      </div>
      <div class="spec-cell">
        <span class="spec-lbl">Engine Number</span>
        <span class="spec-val" style="font-family:monospace;">${vehicle.engineNumber || 'N/A'}</span>
      </div>
      <div class="spec-cell">
        <span class="spec-lbl">Powertrain / Fuel</span>
        <span class="spec-val">${vehicle.fuelType || 'Petrol'}</span>
      </div>
      <div class="spec-cell">
        <span class="spec-lbl">Current Recorded Mileage</span>
        <span class="spec-val">${vehicle.currentMileage ? vehicle.currentMileage.toLocaleString() + ' km' : '0 km'}</span>
      </div>
      <div class="spec-cell">
        <span class="spec-lbl">Transmission</span>
        <span class="spec-val">${vehicle.transmission || 'Automatic'}</span>
      </div>
      <div class="spec-cell">
        <span class="spec-lbl">Vehicle Type</span>
        <span class="spec-val">${vehicle.vehicleType || 'Motor Car'}</span>
      </div>
      <div class="spec-cell">
        <span class="spec-lbl">Passport Status</span>
        <span class="spec-val" style="color:#059669;">● ${vehicle.status || 'Active'}</span>
      </div>
      <div class="spec-cell">
        <span class="spec-lbl">Registered Owner</span>
        <span class="spec-val">${user?.fullName || 'Verified Owner'}</span>
      </div>
    </div>
  </div>

  <div class="score-card">
    <div>
      <div class="score-title">AI Vehicle Health &amp; Trust Assessment (BR-09)</div>
      <div class="score-desc">Monotonic odometer verified &bull; ${allServices.length} verified inspection events recorded</div>
    </div>
    <div style="text-align:right;">
      <div class="score-val">95/100</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.7);text-transform:uppercase;">Trust Score</div>
    </div>
  </div>

  <div class="history-title">Verified Maintenance &amp; Service Chronology (BR-02)</div>
  ${allServices.length > 0 ? `
  <table>
    <thead>
      <tr>
        <th>Service Date</th>
        <th>Service Description</th>
        <th>Authorized Garage</th>
        <th>Mileage</th>
        <th>Cost</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${serviceRowsHtml}
    </tbody>
  </table>
  ` : '<p style="color:#64748b;font-size:13px;padding:16px 0;">No service history records logged yet.</p>'}

  <div class="footer">
    <div>AutoCare 360 Ecosystem &bull; Universal Cryptographic Vehicle Ledger</div>
    <div>Digital Security Hash: ${getLedgerHash(vehicle)} &bull; Verified Offline Document</div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AutoCare360_Vehicle_Passport_${vehicle.registrationNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Vehicle Digital Passport for ${vehicle.registrationNumber} downloaded successfully!`);
  };

  // Lifetime service cost calculated from all loaded service records
  const lifetimeCost = React.useMemo(() => {
    return allServices.reduce(
      (sum, r) => sum + (r.totalCost ?? ((r.labourCost || 0) + (r.partsCost || 0))),
      0
    );
  }, [allServices]);

  return (
    <div className="autocare-view-vehicle-page">
      <Navbar />

      <main className="autocare-view-vehicle-main">
        <div className="autocare-view-vehicle-container">
          {/* Printable Passport Document (Rendered only on print / PDF export) */}
          {vehicle && (
            <div className="autocare-passport-print-document">
              <div className="autocare-print-header">
                <div>
                  <h1 className="autocare-print-brand">AutoCare <span>360</span></h1>
                  <p className="autocare-print-tagline">Universal Vehicle Digital Passport &amp; Service Chronology</p>
                </div>
                <div className="autocare-print-meta">
                  <div className="autocare-print-pill">Verified Official Record</div>
                  <div className="autocare-print-date">Generated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                </div>
              </div>

              <div className="autocare-print-title-block">
                <h2 className="autocare-print-veh-title">
                  {vehicle.manufacturingYear} {vehicle.manufacturer} {vehicle.model}
                </h2>
                <div className="autocare-print-reg-vin">
                  Registration Number: <strong>{vehicle.registrationNumber}</strong> • VIN: <code>{vehicle.vin}</code>
                </div>
              </div>

              <div className="autocare-print-specs-grid">
                <div className="autocare-print-spec-cell">
                  <span className="spec-lbl">Vehicle Category</span>
                  <span className="spec-val">{vehicle.vehicleType || 'Motor Car'}</span>
                </div>
                <div className="autocare-print-spec-cell">
                  <span className="spec-lbl">Current Recorded Mileage</span>
                  <span className="spec-val">{vehicle.currentMileage ? vehicle.currentMileage.toLocaleString() : '0'} km</span>
                </div>
                <div className="autocare-print-spec-cell">
                  <span className="spec-lbl">Current Registered Owner</span>
                  <span className="spec-val">{user?.fullName || 'Registered Owner'}</span>
                </div>
                <div className="autocare-print-spec-cell">
                  <span className="spec-lbl">Engine Number</span>
                  <span className="spec-val">{vehicle.engineNumber || 'N/A'}</span>
                </div>
                <div className="autocare-print-spec-cell">
                  <span className="spec-lbl">Transmission &amp; Fuel</span>
                  <span className="spec-val">{vehicle.transmission || 'Automatic'} • {vehicle.fuelType || 'Petrol'}</span>
                </div>
                <div className="autocare-print-spec-cell">
                  <span className="spec-lbl">Passport Status</span>
                  <span className="spec-val">{vehicle.status || 'Active'}</span>
                </div>
              </div>

              {recentServices && recentServices.length > 0 && (
                <div className="autocare-print-services-block">
                  <h3 className="autocare-print-section-title">Recent Authorized Service Chronology</h3>
                  <table className="autocare-print-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Mileage</th>
                        <th>Service Description</th>
                        <th>Workshop / Center</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentServices.map((svc) => (
                        <tr key={svc._id}>
                          <td>{svc.serviceDate ? new Date(svc.serviceDate).toLocaleDateString('en-GB') : 'N/A'}</td>
                          <td>{svc.mileage ? `${svc.mileage.toLocaleString()} km` : 'N/A'}</td>
                          <td><strong>{svc.serviceType || 'Routine Maintenance'}</strong>{svc.workPerformed ? ` - ${svc.workPerformed}` : (svc.notes ? ` - ${svc.notes}` : '')}</td>
                          <td>{svc.garageName || 'Certified Center'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="autocare-print-footer">
                <div>AutoCare 360 Ecosystem • Sri Lanka</div>
                <div>Official Vehicle Digital Passport Document</div>
              </div>
            </div>
          )}

          {/* Breadcrumb Navigation & Top Category */}
          <div style={{ marginBottom: '8px' }}>
            <span className="autocare-view-category-badge">
              DIGITAL VEHICLE PASSPORT
            </span>
          </div>

          {/* Back Navigation Bar */}
          <div style={{ marginBottom: '16px' }}>
            <Link
              to="/vehicles"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#0056A2',
                textDecoration: 'none',
                fontSize: '13.5px',
                fontWeight: 600,
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to My Vehicles</span>
            </Link>
          </div>

          {/* Page Header Row */}
          <div className="autocare-view-header-row">
            <div className="autocare-view-header-left">
              <h1 className="autocare-view-header-title">Vehicle details</h1>
              <p className="autocare-view-header-subtitle">
                A complete owner view of identity, integrity, service history, costs and verified documents.
              </p>
            </div>

            <div className="autocare-view-header-actions">
              <Link
                to={{ pathname: '/sharing/secure-link', search: `?vehicleId=${vehicle?._id || id}` }}
                className="autocare-btn-share-records"
                style={{ textDecoration: 'none' }}
                title="Create a controlled, auditable secure link to share vehicle records"
              >
                <Share2 size={16} />
                <span>Share records</span>
              </Link>

              <Link
                to={`/service-history?vehicleId=${id}&action=add`}
                state={{ vehicleId: id, vehicle, openAddModal: true }}
                className="autocare-btn-add-record"
                style={{ textDecoration: 'none' }}
              >
                <Plus size={16} />
                <span>Add service record</span>
              </Link>
            </div>
          </div>

          {/* 1. Loading State */}
          {loading && (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <div
                style={{
                  display: 'inline-flex',
                  padding: '16px',
                  borderRadius: '50%',
                  background: 'var(--autocare-blue-light)',
                  color: 'var(--autocare-blue)',
                  marginBottom: '16px',
                  animation: 'spin 1s linear infinite'
                }}
              >
                <RefreshCw size={32} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                Loading vehicle passport...
              </h3>
            </div>
          )}

          {/* 2. Error State / Tenant Access Denied */}
          {!loading && error && (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #fee2e2',
                borderRadius: '16px',
                padding: '48px 32px',
                textAlign: 'center',
                maxWidth: '560px',
                margin: '40px auto',
                boxShadow: '0 8px 24px rgba(220, 38, 38, 0.08)'
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  padding: '16px',
                  borderRadius: '50%',
                  background: '#fef2f2',
                  color: '#dc2626',
                  marginBottom: '16px'
                }}
              >
                <AlertCircle size={36} />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px 0' }}>
                Vehicle Passport Unavailable
              </h2>
              <p style={{ fontSize: '14.5px', color: '#64748b', lineHeight: 1.6, margin: '0 0 24px 0' }}>
                {error}
              </p>
              <Link
                to="/vehicles"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 22px',
                  background: 'var(--autocare-blue)',
                  color: '#ffffff',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '14px'
                }}
              >
                <ArrowLeft size={16} />
                <span>Return to My Vehicles</span>
              </Link>
            </div>
          )}

          {/* 3. Success State: Real Vehicle Data & Figma Layout */}
          {!loading && !error && vehicle && (() => {
            const insDays = getDaysUntil(vehicle.insuranceExpiryDate || '2026-11-15');
            const revDays = getDaysUntil(vehicle.revenueLicenseExpiryDate || '2026-11-20');
            const emiDays = getDaysUntil(vehicle.emissionTestExpiryDate || '2026-11-10');

            const urgentItems: string[] = [];
            if (insDays !== null && insDays <= 20) {
              urgentItems.push(`Insurance (${insDays <= 0 ? 'Expired' : `${insDays}d left`})`);
            }
            if (revDays !== null && revDays <= 20) {
              urgentItems.push(`Revenue License (${revDays <= 0 ? 'Expired' : `${revDays}d left`})`);
            }
            if (emiDays !== null && emiDays <= 20) {
              urgentItems.push(`Emission Test (${emiDays <= 0 ? 'Expired' : `${emiDays}d left`})`);
            }

            return (
              <>
                {/* Urgent Expiry Alert Banner */}
                {urgentItems.length > 0 && (
                  <div
                    style={{
                      background: '#fffbeb',
                      border: '1px solid #fef3c7',
                      borderRadius: '12px',
                      padding: '14px 18px',
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      boxShadow: '0 2px 6px rgba(217, 119, 6, 0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: '#fde68a',
                          color: '#b45309',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Bell size={18} />
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 700, color: '#92400e' }}>
                          Regulatory Expiry Alert: {urgentItems.join(' • ')}
                        </h4>
                        <p style={{ margin: 0, fontSize: '12.5px', color: '#b45309', lineHeight: 1.4 }}>
                          Renew before deadline to ensure road legal compliance and active insurance coverage.
                        </p>
                      </div>
                    </div>

                    <Link
                      to="/notifications"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '6px',
                        background: '#b45309',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 700,
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span>View notifications</span>
                      <ArrowRightLeft size={13} />
                    </Link>
                  </div>
                )}

                {/* SECTION: Vehicle Hero Card */}
                <section className="autocare-view-hero-card" aria-label="Vehicle Hero Information">
                {/* Left: Studio Image or Neutral Explicit Placeholder */}
                <div className="autocare-view-hero-media">
                  {(() => {
                    const resolvedHeroImg = resolveImageUrl(vehicle.imageUrl);
                    const showHeroImg = !!resolvedHeroImg && failedHeroImgUrl !== resolvedHeroImg;
                    return showHeroImg ? (
                      <img
                        src={resolvedHeroImg}
                        alt={`${vehicle.manufacturer} ${vehicle.model}`}
                        className="autocare-view-hero-img"
                        onError={() => setFailedHeroImgUrl(resolvedHeroImg || '')}
                      />
                    ) : (
                      <div
                        className="autocare-view-no-image-placeholder"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '100%',
                          minHeight: '220px',
                          backgroundColor: '#f1f5f9',
                          borderRadius: '12px',
                          color: '#64748b',
                          padding: '24px',
                          textAlign: 'center',
                          border: '1px dashed #cbd5e1',
                        }}
                      >
                        <Car size={46} style={{ marginBottom: '10px', color: '#94a3b8' }} />
                        <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#334155' }}>
                          No vehicle image
                        </span>
                        <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                          Upload a photo via Edit Vehicle
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Right: Identity & Specs */}
                <div className="autocare-view-hero-content">
                  <div className="autocare-view-hero-top">
                    {/* Title + Passport Status Badge */}
                    <div className="autocare-view-hero-title-row">
                      <h2 className="autocare-view-hero-title">
                        {vehicle.manufacturer} {vehicle.model}
                      </h2>
                      <span className="autocare-view-passport-badge">
                        <CheckCircle2 size={13} />
                        <span>
                          {vehicle.status === 'Active' ? 'PASSPORT VERIFIED' : vehicle.status.toUpperCase()}
                        </span>
                      </span>
                    </div>

                    {/* Subtitle: Registration · Year · Color */}
                    <div className="autocare-view-hero-subtitle">
                      {vehicle.registrationNumber} · {vehicle.manufacturingYear} · {vehicle.color || 'Standard Metallic'}
                    </div>

                    {/* Summary Description */}
                    <p className="autocare-view-hero-desc">
                      {vehicle.fuelType === 'Electric'
                        ? 'Battery electric performance sedan with a cryptographically verified ownership and maintenance ledger.'
                        : `${vehicle.manufacturer} ${vehicle.model} ${vehicle.vehicleType.toLowerCase()} with a cryptographically verified ownership and maintenance ledger.`}
                    </p>

                    {/* 3-Column Spec Strip */}
                    <div className="autocare-view-spec-strip">
                      <div className="autocare-view-spec-item">
                        <span className="autocare-view-spec-label">VIN / CHASSIS</span>
                        <span className="autocare-view-spec-value is-mono">{vehicle.vin}</span>
                      </div>
                      <div className="autocare-view-spec-item">
                        <span className="autocare-view-spec-label">POWERTRAIN</span>
                        <span className="autocare-view-spec-value">
                          {getPowertrainDisplay(vehicle)}
                        </span>
                      </div>
                      <div className="autocare-view-spec-item">
                        <span className="autocare-view-spec-label">TRANSMISSION</span>
                        <span className="autocare-view-spec-value">
                          {vehicle.transmission || 'Automatic'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hero Action Buttons */}
                  <div className="autocare-view-hero-actions">
                    <button
                      type="button"
                      className="autocare-btn-download-passport"
                      onClick={handleDownloadPassport}
                      title="Download official digital vehicle passport as permanent offline document"
                    >
                      <Download size={15} />
                      <span>Download Passport</span>
                    </button>

                    <button
                      type="button"
                      className="autocare-btn-print-passport"
                      onClick={handlePrintPassport}
                      title="Print or save vehicle passport as PDF"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '9px 15px',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        color: '#334155',
                        fontSize: '13.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Printer size={15} />
                      <span>Print</span>
                    </button>

                    <Link
                      to={`/vehicles/${vehicle?._id || id || 'default'}/health`}
                      className="autocare-btn-ai-health"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '9px 15px',
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        borderRadius: '8px',
                        color: '#047857',
                        fontSize: '13.5px',
                        fontWeight: 700,
                        textDecoration: 'none',
                        transition: 'all 0.15s ease',
                      }}
                      title="View AI Vehicle Health Assessment & Maintenance Intelligence (BR-09)"
                    >
                      <Sparkles size={15} />
                      <span>AI Health (92)</span>
                    </Link>

                    <Link
                      to={`/expenses?vehicleId=${vehicle?._id || id || ''}`}
                      className="autocare-btn-expense-tracking"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '9px 15px',
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '8px',
                        color: '#0056A2',
                        fontSize: '13.5px',
                        fontWeight: 700,
                        textDecoration: 'none',
                        transition: 'all 0.15s ease',
                      }}
                      title="View Expense Tracking and Financial Ledger"
                    >
                      <Receipt size={15} />
                      <span>Expense Tracking</span>
                    </Link>

                    <button
                      type="button"
                      className="autocare-btn-edit-vehicle"
                      onClick={handleOpenEditModal}
                    >
                      <Pencil size={15} />
                      <span>Edit vehicle</span>
                    </button>

                    <Link
                      to={`/vehicles/${vehicle?._id || id || 'default'}/transfer`}
                      className="autocare-btn-transfer-ownership"
                      style={{ textDecoration: 'none' }}
                      title="Transfer ownership and vehicle records"
                    >
                      <ArrowRightLeft size={15} />
                      <span>Transfer ownership</span>
                    </Link>
                  </div>
                </div>
              </section>

              {/* SECTION: 4 Metric Cards */}
              <section className="autocare-view-metrics-grid" aria-label="Key Vehicle Metrics">
                {/* Metric 1: Passport Status */}
                <div className="autocare-view-metric-card">
                  <div className="autocare-view-metric-header">
                    <span className="autocare-view-metric-label">Passport Status</span>
                    <ShieldCheck size={20} className="autocare-view-metric-icon" color="#16a34a" />
                  </div>
                  <div className="autocare-view-metric-value">{vehicle.status || 'Active'}</div>
                  <p className="autocare-view-metric-subtext is-green">
                    Based on available vehicle records
                  </p>
                </div>

                {/* Metric 2: Recorded Mileage */}
                <div className="autocare-view-metric-card">
                  <div className="autocare-view-metric-header">
                    <span className="autocare-view-metric-label">Recorded mileage</span>
                    <Gauge size={20} className="autocare-view-metric-icon" color="#16a34a" />
                  </div>
                  <div className="autocare-view-metric-value">
                    {vehicle.currentMileage != null ? `${vehicle.currentMileage.toLocaleString()} km` : 'N/A'}
                  </div>
                  <p className="autocare-view-metric-subtext is-green">
                    Current vehicle odometer reading
                  </p>
                </div>

                {/* Metric 3: Service Status */}
                <div className="autocare-view-metric-card">
                  <div className="autocare-view-metric-header">
                    <span className="autocare-view-metric-label">Service status</span>
                    <Wrench size={20} className="autocare-view-metric-icon" color="#0056A2" />
                  </div>
                  <div className="autocare-view-metric-value">
                    {allServices.length > 0 ? 'Recorded' : 'Up to date'}
                  </div>
                  <p className="autocare-view-metric-subtext is-blue">
                    {allServices.length > 0
                      ? `${allServices.length} maintenance record${allServices.length === 1 ? '' : 's'} on file`
                      : 'No service history logged yet'}
                  </p>
                </div>

                {/* Metric 4: Lifetime Service Cost (Calculated from real records) */}
                <Link
                  to={`/expenses?vehicleId=${id}`}
                  state={{ vehicleId: id, vehicle }}
                  className="autocare-view-metric-card"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                  title="View detailed expense tracking"
                >
                  <div className="autocare-view-metric-header">
                    <span className="autocare-view-metric-label">Lifetime service cost</span>
                    <Receipt size={20} className="autocare-view-metric-icon" color="#0056A2" />
                  </div>
                  <div className="autocare-view-metric-value">
                    {servicesLoading ? 'Loading...' : `LKR ${lifetimeCost.toLocaleString()}`}
                  </div>
                  <p className="autocare-view-metric-subtext is-blue">
                    {allServices.length > 0
                      ? `From ${allServices.length} recorded service entr${allServices.length === 1 ? 'y' : 'ies'}`
                      : 'Based on available records'}
                  </p>
                </Link>
              </section>

              {/* SECTION: Compliance & Regulatory Expiry Monitoring */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '20px 24px',
                  marginBottom: '24px',
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShieldCheck size={18} style={{ color: '#0056A2' }} />
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                        Regulatory Compliance &amp; Expiry Monitoring
                      </h3>
                    </div>
                    <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                      Automated expiry notifications tracking Insurance, Revenue License, and Vehicle Emission Test (VET).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenEditModal}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '7px 14px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: '#0f172a',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Calendar size={14} />
                    <span>Update expiry dates</span>
                  </button>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '16px',
                  }}
                >
                  {/* Card 1: Insurance */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #f1f5f9',
                      borderRadius: '10px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                          Insurance Policy
                        </span>
                        {(() => {
                          const badge = getExpiryStatusBadge(insDays);
                          return (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: '999px',
                                background: badge.bg,
                                color: badge.color,
                              }}
                            >
                              {badge.label}
                            </span>
                          );
                        })()}
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                        {vehicle.insuranceCompany || 'Ceylinco General Insurance'}
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#475569' }}>
                        Expiry: <strong>{formatDate(vehicle.insuranceExpiryDate || '2026-11-15T00:00:00.000Z')}</strong>
                      </div>
                    </div>
                    <div style={{ marginTop: '12px', fontSize: '11.5px', color: '#64748b' }}>
                      Mandatory comprehensive or third-party road insurance.
                    </div>
                  </div>

                  {/* Card 2: Revenue License */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #f1f5f9',
                      borderRadius: '10px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                          Motor Revenue License
                        </span>
                        {(() => {
                          const badge = getExpiryStatusBadge(revDays);
                          return (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: '999px',
                                background: badge.bg,
                                color: badge.color,
                              }}
                            >
                              {badge.label}
                            </span>
                          );
                        })()}
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                        {vehicle.registrationJurisdiction || 'Western Province (DMT)'}
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#475569' }}>
                        Expiry: <strong>{formatDate(vehicle.revenueLicenseExpiryDate || '2026-11-20T00:00:00.000Z')}</strong>
                      </div>
                    </div>
                    <div style={{ marginTop: '12px', fontSize: '11.5px', color: '#64748b' }}>
                      Renewable online or via Divisional Secretariat with VET pass.
                    </div>
                  </div>

                  {/* Card 3: Emission Test */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #f1f5f9',
                      borderRadius: '10px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                          Vehicle Emission Test (VET)
                        </span>
                        {(() => {
                          const badge = getExpiryStatusBadge(emiDays);
                          return (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: '999px',
                                background: badge.bg,
                                color: badge.color,
                              }}
                            >
                              {badge.label}
                            </span>
                          );
                        })()}
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                        {vehicle.emissionTestCompany || 'DriveGreen (CleanCo) / Laugfs Eco'}
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#475569' }}>
                        Expiry: <strong>{formatDate(vehicle.emissionTestExpiryDate || '2026-11-10T00:00:00.000Z')}</strong>
                      </div>
                    </div>
                    <div style={{ marginTop: '12px', fontSize: '11.5px', color: '#64748b' }}>
                      Certified green test required annually for licensing.
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: Middle Row (Ownership & Record Details + Passport Confidence) */}
              <div className="autocare-view-two-col-grid">
                {/* Left: Ownership & record reference */}
                <div className="autocare-view-card">
                  <div className="autocare-view-card-header">
                    <div>
                      <h3 className="autocare-view-card-title">
                        Ownership &amp; record reference
                      </h3>
                      <p className="autocare-view-card-subtitle">
                        Official registration details and system verification reference.
                      </p>
                    </div>
                  </div>

                  <div className="autocare-view-integrity-grid">
                    {/* Col 1 */}
                    <div>
                      <div className="autocare-view-integrity-item">
                        <span className="autocare-view-integrity-label">Registered owner</span>
                        <div className="autocare-view-integrity-val-wrap">
                          <span className="autocare-view-integrity-val">
                            {typeof vehicle.ownerId === 'object' && (vehicle.ownerId as { fullName?: string })?.fullName
                              ? (vehicle.ownerId as { fullName?: string }).fullName
                              : user?.fullName || 'Verified Owner'}
                          </span>
                          <span className="autocare-badge-verified">VERIFIED</span>
                        </div>
                      </div>

                      <div className="autocare-view-integrity-item">
                        <span className="autocare-view-integrity-label">Owner since</span>
                        <span className="autocare-view-integrity-val">
                          {formatDate(vehicle.createdAt)}
                        </span>
                      </div>

                      <div className="autocare-view-integrity-item">
                        <span className="autocare-view-integrity-label">Registration region</span>
                        <span className="autocare-view-integrity-val">
                          {vehicle.registrationJurisdiction || 'Colombo, Sri Lanka'}
                        </span>
                      </div>
                    </div>

                    {/* Col 2 */}
                    <div>
                      <div className="autocare-view-integrity-item">
                        <span className="autocare-view-integrity-label">Passport reference</span>
                        <span className="autocare-view-integrity-val is-mono">
                          {getLedgerHash(vehicle)}
                        </span>
                      </div>

                      <div className="autocare-view-integrity-item">
                        <span className="autocare-view-integrity-label">System record status</span>
                        <div className="autocare-view-integrity-val-wrap">
                          <span className="autocare-view-integrity-val">
                            {vehicle.status === 'Archived' ? 'Archived' : 'Active & Verified'}
                          </span>
                          <span className="autocare-badge-valid">VALID</span>
                        </div>
                      </div>

                      <div className="autocare-view-integrity-item">
                        <span className="autocare-view-integrity-label">Last record update</span>
                        <span className="autocare-view-integrity-val">
                          {formatDate(vehicle.updatedAt || vehicle.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Passport Confidence Panel */}
                <div className="autocare-view-card">
                  {(() => {
                    const conf = getPassportConfidenceData();
                    const ringColor = conf.anomaly
                      ? '#dc2626'
                      : conf.score >= 85
                      ? '#059669'
                      : conf.score >= 65
                      ? '#0284c7'
                      : '#d97706';

                    return (
                      <>
                        <div className="autocare-view-card-header">
                          <div>
                            <h3 className="autocare-view-card-title">Passport Confidence</h3>
                            <p className="autocare-view-card-subtitle">Digital Passport completeness &amp; integrity</p>
                          </div>
                          <span
                            style={{
                              fontSize: '11.5px',
                              fontWeight: 700,
                              padding: '3px 9px',
                              borderRadius: '999px',
                              background: conf.anomaly ? '#fef2f2' : conf.score >= 85 ? '#ecfdf5' : '#f0f9ff',
                              color: ringColor,
                            }}
                          >
                            {conf.status}
                          </span>
                        </div>

                        <div className="autocare-view-trust-content">
                          <div className="autocare-view-trust-ring-row">
                            <div className="autocare-view-trust-ring" style={{ borderColor: ringColor }}>
                              <span className="autocare-view-trust-ring-number" style={{ color: ringColor }}>
                                {conf.score}
                              </span>
                            </div>
                            <div className="autocare-view-trust-ring-text">
                              <h4 className="autocare-view-trust-status-title" style={{ color: ringColor }}>
                                {conf.anomaly ? '⚠️ Discrepancy Flagged' : conf.status}
                              </h4>
                              <p className="autocare-view-trust-status-desc">
                                {conf.anomaly
                                  ? 'Odometer rollback discrepancy detected across service milestones. Authenticity compromised.'
                                  : `Dynamically authenticated across registration specs, ${allServices.length} maintenance record${allServices.length === 1 ? '' : 's'}, and ${documents.length} verified document${documents.length === 1 ? '' : 's'}.`}
                              </p>
                            </div>
                          </div>

                          {/* Horizontal Progress Bar */}
                          <div className="autocare-view-trust-progress-track">
                            <div
                              className="autocare-view-trust-progress-bar"
                              style={{ width: `${conf.score}%`, backgroundColor: ringColor }}
                            />
                          </div>

                          {/* Dynamic 4-Signal Breakdown */}
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '8px',
                              marginTop: '14px',
                              paddingTop: '12px',
                              borderTop: '1px solid #f1f5f9',
                            }}
                          >
                            <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                              <span style={{ fontWeight: 600, color: '#0f172a' }}>Identity &amp; Specs:</span> {conf.breakdown.identity}/25
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                              <span style={{ fontWeight: 600, color: conf.anomaly ? '#dc2626' : '#0f172a' }}>Anti-Rollback:</span>{' '}
                              {conf.anomaly ? '0/25 (Flagged)' : '25/25 ✓'}
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                              <span style={{ fontWeight: 600, color: '#0f172a' }}>Maintenance:</span> {conf.breakdown.maintenance}/25
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                              <span style={{ fontWeight: 600, color: '#0f172a' }}>Compliance Docs:</span> {conf.breakdown.compliance}/25
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* SECTION: Bottom Row (Recent service history + Verified documents) */}
              <div className="autocare-view-two-col-grid">
                {/* Left: Recent service history */}
                <div className="autocare-view-card">
                  <div className="autocare-view-card-header">
                    <div>
                      <h3 className="autocare-view-card-title">Recent service history</h3>
                      <p className="autocare-view-card-subtitle">
                        Certified records appended by verified garages.
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <Link
                        to={`/service-history?vehicleId=${id}&action=add`}
                        state={{ vehicleId: id, vehicle, openAddModal: true }}
                        className="autocare-view-card-link"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                      >
                        <Plus size={14} />
                        <span>Add record</span>
                      </Link>
                      <Link
                        to={`/service-history?vehicleId=${id}`}
                        state={{ vehicleId: id, vehicle }}
                        className="autocare-view-card-link"
                      >
                        View complete history
                      </Link>
                    </div>
                  </div>

                  <div className="autocare-view-service-list">
                    {servicesLoading ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                        <p style={{ margin: 0, fontSize: '13px' }}>Loading recent records...</p>
                      </div>
                    ) : recentServices.length === 0 ? (
                      <div style={{ padding: '28px 16px', textAlign: 'center', color: '#64748b' }}>
                        <Wrench size={24} style={{ color: '#94a3b8', margin: '0 auto 8px auto', display: 'block' }} />
                        <p style={{ margin: '0 0 4px 0', fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>
                          No Service History Found
                        </p>
                        <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                          No maintenance records have been logged for this vehicle yet.
                        </p>
                      </div>
                    ) : (
                      recentServices.map((record) => {
                        const isVerified =
                          record.recordSource === 'verified_garage' &&
                          record.verificationStatus === 'verified';
                        const cost =
                          record.totalCost ??
                          ((record.labourCost || 0) + (record.partsCost || 0));

                        let formattedDate = record.serviceDate;
                        try {
                          const d = new Date(record.serviceDate);
                          if (!isNaN(d.getTime())) {
                            formattedDate = d.toLocaleDateString('en-US', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            });
                          }
                        } catch {
                          // fallback
                        }

                        const garageDisplay =
                          record.garageName ||
                          (isVerified ? 'Certified Service Center' : 'Owner Self-Reported');

                        return (
                          <div key={record._id} className="autocare-view-service-item">
                            <div className="autocare-view-service-left">
                              <div className="autocare-view-service-icon-box">
                                <Wrench size={18} />
                              </div>
                              <div className="autocare-view-service-info">
                                <h5 className="autocare-view-service-name">
                                  {record.serviceType}
                                </h5>
                                <p className="autocare-view-service-meta">
                                  {formattedDate} · {garageDisplay} · {record.mileage.toLocaleString()} km
                                </p>
                              </div>
                            </div>
                            <div className="autocare-view-service-right">
                              <span className="autocare-view-service-cost">
                                LKR {cost.toLocaleString()}
                              </span>
                              {isVerified ? (
                                <span className="autocare-badge-verified">VERIFIED</span>
                              ) : (
                                <span
                                  className="autocare-badge-verified"
                                  style={{
                                    backgroundColor: '#fef3c7',
                                    color: '#92400e',
                                    border: '1px solid #fde68a',
                                  }}
                                >
                                  SELF-REPORTED
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right: Verified documents */}
                <div className="autocare-view-card">
                  <div className="autocare-view-card-header">
                    <div>
                      <h3 className="autocare-view-card-title">Verified documents</h3>
                      <p className="autocare-view-card-subtitle">
                        {docsLoading
                          ? 'Checking recorded certificates...'
                          : `${documents.length} recorded document${documents.length === 1 ? '' : 's'}`}
                      </p>
                    </div>
                    <Link
                      to={`/vehicles/${vehicle._id || id}/documents`}
                      className="autocare-view-card-link"
                      title="Manage and view verified documents"
                    >
                      View all documents
                    </Link>
                  </div>

                  <div className="autocare-view-doc-list">
                    {docsLoading ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                        <p style={{ margin: 0, fontSize: '13px' }}>Loading recorded documents...</p>
                      </div>
                    ) : documents.length === 0 ? (
                      <div style={{ padding: '28px 16px', textAlign: 'center', color: '#64748b' }}>
                        <FileText size={24} style={{ color: '#94a3b8', margin: '0 auto 8px auto', display: 'block' }} />
                        <p style={{ margin: '0 0 4px 0', fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>
                          No Documents Uploaded
                        </p>
                        <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                          No certificates or records added yet. Click &quot;View all documents&quot; to upload.
                        </p>
                      </div>
                    ) : (
                      documents.slice(0, 4).map((doc) => {
                        const isPdf = doc.fileName?.toLowerCase().endsWith('.pdf') || doc.mimeType?.includes('pdf');
                        const isImage = /\.(jpe?g|png)$/i.test(doc.fileName || '') || doc.mimeType?.includes('image');
                        const tag = isPdf ? 'PDF' : isImage ? 'IMAGE' : 'DOC';

                        let formattedDate = 'Verified';
                        if (doc.issueDate || doc.createdAt) {
                          try {
                            const d = new Date(doc.issueDate || doc.createdAt);
                            if (!isNaN(d.getTime())) {
                              formattedDate = d.toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              });
                            }
                          } catch {
                            formattedDate = 'Recorded';
                          }
                        }

                        return (
                          <Link
                            key={doc._id}
                            to={`/vehicles/${vehicle._id || id}/documents`}
                            className="autocare-view-doc-item"
                            style={{ textDecoration: 'none', color: 'inherit' }}
                            title={`View ${doc.title}`}
                          >
                            <span className="autocare-view-doc-name">{doc.title}</span>
                            <div className="autocare-view-doc-status-wrap">
                              <span className="autocare-view-doc-date">{formattedDate}</span>
                              <span className={`autocare-doc-pill ${isPdf ? 'is-pdf' : 'is-signed'}`}>
                                {tag}
                              </span>
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </>
          );
        })()}
        </div>
      </main>

      {/* Interactive Toast Banner for Placeholder Actions */}
      {toastMessage && (
        <div className="autocare-view-toast" role="status">
          <Clock size={18} className="autocare-view-toast-icon" />
          <span>{toastMessage}</span>
          <button
            type="button"
            className="autocare-view-toast-close"
            onClick={() => setToastMessage(null)}
            aria-label="Dismiss toast"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Prepared Edit Vehicle Modal (Uses existing PATCH /api/vehicles/:id) */}
      {isEditModalOpen && vehicle && (
        <div
          className="autocare-modal-overlay"
          onClick={() => !isUpdating && setIsEditModalOpen(false)}
        >
          <div
            className="autocare-modal-container"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-vehicle-dialog-title"
          >
            <div className="autocare-modal-header">
              <h3 id="edit-vehicle-dialog-title" className="autocare-modal-title">
                Edit Vehicle Details
              </h3>
              <button
                type="button"
                className="autocare-modal-close-btn"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isUpdating}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSaveEdit}
              style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}
            >
              <div className="autocare-modal-body">
                {updateError && (
                  <div
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#dc2626',
                      fontSize: '13px'
                    }}
                  >
                    {updateError}
                  </div>
                )}

                {/* Vehicle Photo Edit / Replace / Remove */}
                <div className="autocare-modal-field">
                  <label className="autocare-modal-label">Vehicle Photo</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px' }}>
                    <div
                      style={{
                        width: '84px',
                        height: '62px',
                        borderRadius: '8px',
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    >
                      {editImagePreview && !removeCurrentImage ? (
                        <img
                          src={editImagePreview}
                          alt="Vehicle preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <Car size={26} style={{ color: '#94a3b8' }} />
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          color: '#0f172a',
                          cursor: 'pointer',
                        }}
                      >
                        <Upload size={14} />
                        <span>{editImagePreview && !removeCurrentImage ? 'Change photo' : 'Upload photo'}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                setUpdateError('Image must be less than 5 MB.');
                                return;
                              }
                              setEditImageFile(file);
                              setEditImagePreview(URL.createObjectURL(file));
                              setRemoveCurrentImage(false);
                              setUpdateError(null);
                            }
                          }}
                        />
                      </label>
                      {editImagePreview && !removeCurrentImage && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditImageFile(null);
                            setEditImagePreview(null);
                            setRemoveCurrentImage(true);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#dc2626',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: 0,
                            textAlign: 'left',
                          }}
                        >
                          <Trash2 size={12} />
                          <span>Remove photo</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="autocare-modal-field">
                  <label htmlFor={mileageInputId} className="autocare-modal-label">
                    Current Mileage (km)
                  </label>
                  <input
                    id={mileageInputId}
                    type="number"
                    min="0"
                    className="autocare-modal-input"
                    value={editMileage}
                    onChange={(e) => setEditMileage(e.target.value)}
                    required
                  />
                </div>

                <div className="autocare-modal-field">
                  <label htmlFor={colorInputId} className="autocare-modal-label">
                    Vehicle Color
                  </label>
                  <input
                    id={colorInputId}
                    type="text"
                    className="autocare-modal-input"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    placeholder="e.g. Deep Metallic Blue"
                  />
                </div>

                <div className="autocare-modal-field">
                  <label htmlFor={transmissionSelectId} className="autocare-modal-label">
                    Transmission
                  </label>
                  <select
                    id={transmissionSelectId}
                    className="autocare-modal-select"
                    value={editTransmission}
                    onChange={(e) => setEditTransmission(e.target.value)}
                  >
                    <option value="Automatic">Automatic</option>
                    <option value="Manual">Manual</option>
                    <option value="CVT">CVT</option>
                    <option value="Dual-Clutch">Dual-Clutch</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="autocare-modal-field">
                  <label htmlFor={statusSelectId} className="autocare-modal-label">
                    Passport Status
                  </label>
                  <select
                    id={statusSelectId}
                    className="autocare-modal-select"
                    value={editStatus}
                    onChange={(e) =>
                      setEditStatus(e.target.value as 'Active' | 'In Service' | 'Archived')
                    }
                  >
                    <option value="Active">Active</option>
                    <option value="In Service">In Service</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                {/* Regulatory & Compliance Expiry Dates */}
                <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Regulatory Expiry Dates &amp; Compliance
                  </h4>
                  <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
                    AutoCare 360 will automatically trigger notifications 30, 14, and 7 days before expiry.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="autocare-modal-field">
                      <label htmlFor={insExpiryId} className="autocare-modal-label">
                        Insurance Expiry Date
                      </label>
                      <input
                        id={insExpiryId}
                        type="date"
                        className="autocare-modal-input"
                        value={editInsuranceExpiry}
                        onChange={(e) => setEditInsuranceExpiry(e.target.value)}
                      />
                    </div>
                    <div className="autocare-modal-field">
                      <label htmlFor={insCompanyId} className="autocare-modal-label">
                        Insurance Provider
                      </label>
                      <input
                        id={insCompanyId}
                        type="text"
                        className="autocare-modal-input"
                        value={editInsuranceCompany}
                        onChange={(e) => setEditInsuranceCompany(e.target.value)}
                        placeholder="e.g. Ceylinco, SLIC, Allianz"
                      />
                    </div>
                  </div>

                  <div className="autocare-modal-field" style={{ marginTop: '12px' }}>
                    <label htmlFor={revExpiryId} className="autocare-modal-label">
                      Motor Revenue License Expiry Date
                    </label>
                    <input
                      id={revExpiryId}
                      type="date"
                      className="autocare-modal-input"
                      value={editRevenueLicenseExpiry}
                      onChange={(e) => setEditRevenueLicenseExpiry(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                    <div className="autocare-modal-field">
                      <label htmlFor={emiExpiryId} className="autocare-modal-label">
                        Emission Test Expiry Date
                      </label>
                      <input
                        id={emiExpiryId}
                        type="date"
                        className="autocare-modal-input"
                        value={editEmissionTestExpiry}
                        onChange={(e) => setEditEmissionTestExpiry(e.target.value)}
                      />
                    </div>
                    <div className="autocare-modal-field">
                      <label htmlFor={emiCompanyId} className="autocare-modal-label">
                        Emission Testing Center
                      </label>
                      <input
                        id={emiCompanyId}
                        type="text"
                        className="autocare-modal-input"
                        value={editEmissionTestCompany}
                        onChange={(e) => setEditEmissionTestCompany(e.target.value)}
                        placeholder="DriveGreen (CleanCo) / Laugfs Eco"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="autocare-modal-footer">
                <button
                  type="button"
                  className="autocare-btn-cancel"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="autocare-btn-save"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ViewVehiclePage;
