const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['owner', 'garage', 'admin'], default: 'owner' },
  status: { type: String, enum: ['active', 'pending', 'suspended'], default: 'active' },
  displayName: String,
}, { timestamps: true });

const VehicleSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  registrationNumber: { type: String, required: true },
  vin: { type: String, required: true },
  manufacturer: { type: String, required: true },
  model: { type: String, required: true },
  manufacturingYear: Number,
  currentMileage: Number,
  fuelType: String,
  transmission: String,
  color: String,
  status: { type: String, default: 'Active' },
}, { timestamps: true });

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const User = mongoose.model('User', UserSchema);
    const Vehicle = mongoose.model('Vehicle', VehicleSchema);

    const defaultPassword = 'Password123!';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // 1. Ensure Nisith Akalanka has Password123! so owner can log in
    const nisith = await User.findOne({ email: 'nisithakalanka@gmail.com' });
    if (nisith) {
      nisith.password = hashedPassword;
      nisith.status = 'active';
      await nisith.save();
      console.log('✓ Updated nisithakalanka@gmail.com with password Password123!');
    }

    // 2. Ensure owner.demo@autocare360.com exists
    let ownerDemo = await User.findOne({ email: 'owner.demo@autocare360.com' });
    if (!ownerDemo) {
      ownerDemo = await User.create({
        fullName: 'Demo Vehicle Owner',
        email: 'owner.demo@autocare360.com',
        phone: '0771234567',
        password: hashedPassword,
        role: 'owner',
        status: 'active',
        displayName: 'Demo Owner',
      });
      console.log('✓ Created owner.demo@autocare360.com');
    } else {
      ownerDemo.password = hashedPassword;
      ownerDemo.status = 'active';
      await ownerDemo.save();
      console.log('✓ Updated owner.demo@autocare360.com');
    }

    // Associate at least one vehicle to owner.demo
    const existingDemoVeh = await Vehicle.findOne({ ownerId: ownerDemo._id });
    if (!existingDemoVeh) {
      await Vehicle.create({
        ownerId: ownerDemo._id,
        registrationNumber: 'CAB-8899',
        vin: '1HGCR2F83HA998877',
        manufacturer: 'Toyota',
        model: 'Prius Hybrid',
        manufacturingYear: 2021,
        currentMileage: 54000,
        fuelType: 'Hybrid',
        transmission: 'Automatic',
        color: 'Pearl White',
        status: 'Active',
      });
      console.log('✓ Created demo vehicle for owner.demo');
    }

    // 3. Ensure garage.demo@autocare360.com exists and is active
    let garageDemo = await User.findOne({ email: 'garage.demo@autocare360.com' });
    if (!garageDemo) {
      garageDemo = await User.create({
        fullName: 'Perera Auto Works (Demo Garage)',
        email: 'garage.demo@autocare360.com',
        phone: '0112345678',
        password: hashedPassword,
        role: 'garage',
        status: 'active',
        displayName: 'Perera Auto Works',
      });
      console.log('✓ Created garage.demo@autocare360.com (active)');
    } else {
      garageDemo.password = hashedPassword;
      garageDemo.status = 'active';
      await garageDemo.save();
      console.log('✓ Updated garage.demo@autocare360.com to active');
    }

    // Also activate ayunibuwanaja4@gmail.com if needed
    const ayuni = await User.findOne({ email: 'ayunibuwanaja4@gmail.com' });
    if (ayuni) {
      ayuni.status = 'active';
      ayuni.password = hashedPassword;
      await ayuni.save();
      console.log('✓ Activated ayunibuwanaja4@gmail.com with password Password123!');
    }

    // 4. Ensure admin.demo@autocare360.com exists
    let adminDemo = await User.findOne({ email: 'admin.demo@autocare360.com' });
    if (!adminDemo) {
      adminDemo = await User.create({
        fullName: 'System Administrator (Demo)',
        email: 'admin.demo@autocare360.com',
        phone: '0770000000',
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        displayName: 'AutoCare Admin',
      });
      console.log('✓ Created admin.demo@autocare360.com');
    } else {
      adminDemo.password = hashedPassword;
      adminDemo.status = 'active';
      await adminDemo.save();
      console.log('✓ Updated admin.demo@autocare360.com');
    }

    console.log('\n--- ALL DEMO ACCOUNTS READY ---');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error seeding demo credentials:', err);
    process.exit(1);
  }
}

seed();
