export interface ServicePartWorkItem {
  task: string;
  certification: string;
}

export interface ServiceRecordItem {
  id: string;
  title: string;
  cost: number;
  currency: string;
  date: string;
  mileage: string;
  isVerified: boolean;
  type: 'verified' | 'self-reported';
  ledgerId: string;
  garage: {
    name: string;
    partnerId: string;
    technician: string;
  };
  workPerformed: ServicePartWorkItem[];
  invoice: {
    number: string;
    paymentMethod: string;
    fileName: string;
    fileSize: string;
    fileType: string;
  };
}
