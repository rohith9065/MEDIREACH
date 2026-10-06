import { Pool } from "pg";

// Sourced from a user-supplied dataset: karur_hospital_doctor_facility_dataset.xlsx
// (20 hospitals, 84 doctors, Karur district, Tamil Nadu). Per that dataset's own README sheet:
//   - Verified: Apollo (100 beds), Government Medical College & Hospital Karur (700-bed
//     capacity), Vijay Hospital (8 critical-care beds); doctor names/specialties for Apollo,
//     Amaravathi, and Vijay Hospital (32 doctors) are from official hospital pages.
//   - Everything else (bed *availability* counts, facility counts, and the remaining 52
//     doctors) is demo/synthetic — the dataset itself flags this, and this project's own
//     standing convention (see root README) is real names + synthetic numbers, disclosed.
// The 52 synthetic doctors were literally named "Dr Demo 001-1" etc. in the source sheet —
// replaced here with ordinary-looking fictional names (their real specialty from the sheet is
// kept) per explicit user direction, so the app doesn't show an obvious placeholder string.
//
// Addresses for 6 hospitals were incomplete in the source sheet (just "Karur, Tamil Nadu") —
// filled in below from a web search of each hospital's own site/listings (see inline comments).
// Coordinates are APPROXIMATE town/taluk centers (some looked up, most estimated from known
// local geography), not geocoded street addresses — same caveat as 004_seed_real_hospitals.ts.
//
// Government Medical College & Hospital, Karur (KAR001) already exists as a seeded entry from
// 004_seed_real_hospitals.ts under registration number MEDIREACH-TN-KARUR-11 — this script
// enriches that same row (verified 700-bed capacity) via ON CONFLICT rather than duplicating it.

interface HospitalSeed {
  id: string; // dataset's own hospital_id, used to key doctors below
  name: string;
  registrationNumber: string;
  address: string;
  latitude: number;
  longitude: number;
  totalBeds: number;
  icuBeds: number;
  icuAvailable: number;
  generalAvailable: number;
  bloodBankCount: number;
  pharmacyCount: number;
  laboratoryCount: number;
  xrayCount: number;
  ctScanCount: number;
  mriCount: number;
  emergencyAvailable: boolean;
  bloodBankAvailable: boolean;
}

const hospitals: HospitalSeed[] = [
  {
    id: "KAR001",
    name: "Government Medical College & Hospital, Karur",
    registrationNumber: "MEDIREACH-TN-KARUR-11", // enriches the existing 004-seeded row
    address: "Government Medical College Hospital campus, Karur, Tamil Nadu – 639004",
    latitude: 10.955,
    longitude: 78.07,
    totalBeds: 700,
    icuBeds: 40,
    icuAvailable: 18,
    generalAvailable: 6,
    bloodBankCount: 2,
    pharmacyCount: 1,
    laboratoryCount: 1,
    xrayCount: 1,
    ctScanCount: 1,
    mriCount: 2,
    emergencyAvailable: true,
    bloodBankAvailable: true,
  },
  {
    id: "KAR002",
    name: "Apollo Hospitals, Karur",
    registrationNumber: "MEDIREACH-KARUR-KAR002",
    address: "163 A-E, Allwyn Nagar, LGB Nagar, Kovai Main Road, Karur, Tamil Nadu – 639002",
    latitude: 10.952,
    longitude: 78.065,
    totalBeds: 100,
    icuBeds: 12,
    icuAvailable: 8,
    generalAvailable: 4,
    bloodBankCount: 1,
    pharmacyCount: 1,
    laboratoryCount: 1,
    xrayCount: 1,
    ctScanCount: 1,
    mriCount: 2,
    emergencyAvailable: true,
    bloodBankAvailable: true,
  },
  {
    id: "KAR003",
    name: "Amaravathi Hospital",
    registrationNumber: "MEDIREACH-KARUR-KAR003",
    // Sheet only had "Amaravathi Hospital, Karur, Tamil Nadu" — completed via web search:
    // https://www.amaravathihospital.in/contact.php
    address: "74, Ramanujam Nagar, Karur, Tamil Nadu – 639002",
    latitude: 10.96,
    longitude: 78.085,
    totalBeds: 120,
    icuBeds: 15,
    icuAvailable: 8,
    generalAvailable: 4,
    bloodBankCount: 1,
    pharmacyCount: 1,
    laboratoryCount: 1,
    xrayCount: 1,
    ctScanCount: 1,
    mriCount: 2,
    emergencyAvailable: true,
    bloodBankAvailable: true,
  },
  {
    id: "KAR004",
    name: "Vijay Hospital",
    registrationNumber: "MEDIREACH-KARUR-KAR004",
    address: "Vijay Hospital, 81, South Narasimapuram North Road, Jawahar Bazaar, Karur, Tamil Nadu – 639001",
    latitude: 10.9601,
    longitude: 78.0766,
    totalBeds: 100,
    icuBeds: 8,
    icuAvailable: 6,
    generalAvailable: 3,
    bloodBankCount: 1,
    pharmacyCount: 1,
    laboratoryCount: 1,
    xrayCount: 1,
    ctScanCount: 1,
    mriCount: 1,
    emergencyAvailable: true,
    bloodBankAvailable: true,
  },
  {
    id: "KAR005",
    name: "Government Headquarters Hospital, Kulithalai",
    registrationNumber: "MEDIREACH-KARUR-KAR005",
    address: "Government Headquarters Hospital, Kulithalai, Karur District, Tamil Nadu – 639107",
    latitude: 10.56,
    longitude: 78.25,
    totalBeds: 250,
    icuBeds: 12,
    icuAvailable: 6,
    generalAvailable: 2,
    bloodBankCount: 1,
    pharmacyCount: 1,
    laboratoryCount: 1,
    xrayCount: 1,
    ctScanCount: 1,
    mriCount: 1,
    emergencyAvailable: true,
    bloodBankAvailable: true,
  },
  {
    id: "KAR006",
    name: "Government Hospital, Aravakurichi",
    registrationNumber: "MEDIREACH-KARUR-KAR006",
    address: "Government Hospital, Aravakurichi, Karur District, Tamil Nadu – 639201",
    latitude: 10.7747,
    longitude: 77.909,
    totalBeds: 100,
    icuBeds: 6,
    icuAvailable: 3,
    generalAvailable: 1,
    bloodBankCount: 1,
    pharmacyCount: 0,
    laboratoryCount: 0,
    xrayCount: 1,
    ctScanCount: 1,
    mriCount: 1,
    emergencyAvailable: true,
    bloodBankAvailable: false,
  },
  {
    id: "KAR007",
    name: "Government Hospital, Krishnarayapuram",
    registrationNumber: "MEDIREACH-KARUR-KAR007",
    address: "Government Hospital, Krishnarayapuram, Karur District, Tamil Nadu – 639102",
    latitude: 10.9444,
    longitude: 78.2792,
    totalBeds: 100,
    icuBeds: 6,
    icuAvailable: 3,
    generalAvailable: 1,
    bloodBankCount: 1,
    pharmacyCount: 0,
    laboratoryCount: 0,
    xrayCount: 1,
    ctScanCount: 1,
    mriCount: 1,
    emergencyAvailable: true,
    bloodBankAvailable: false,
  },
  {
    id: "KAR008",
    name: "Government Hospital, Manmangalam",
    registrationNumber: "MEDIREACH-KARUR-KAR008",
    address: "Government Hospital, Manmangalam, Karur District, Tamil Nadu – 639005",
    latitude: 11.028,
    longitude: 78.064,
    totalBeds: 100,
    icuBeds: 6,
    icuAvailable: 3,
    generalAvailable: 1,
    bloodBankCount: 1,
    pharmacyCount: 0,
    laboratoryCount: 0,
    xrayCount: 1,
    ctScanCount: 1,
    mriCount: 1,
    emergencyAvailable: true,
    bloodBankAvailable: false,
  },
  {
    id: "KAR009",
    name: "Government Hospital, Mylampatti",
    registrationNumber: "MEDIREACH-KARUR-KAR009",
    // Coordinates are a rougher estimate than the rest — Mylampatti's 621301 pincode straddles
    // the Karur/Musiri (Tiruchirappalli) border and a precise town-center figure wasn't found.
    address: "Government Hospital, Mylampatti, Karur District, Tamil Nadu – 621301",
    latitude: 10.895,
    longitude: 78.34,
    totalBeds: 80,
    icuBeds: 4,
    icuAvailable: 2,
    generalAvailable: 1,
    bloodBankCount: 1,
    pharmacyCount: 0,
    laboratoryCount: 0,
    xrayCount: 1,
    ctScanCount: 1,
    mriCount: 1,
    emergencyAvailable: true,
    bloodBankAvailable: false,
  },
  {
    id: "KAR010",
    name: "Government Hospital, Pallapatti",
    registrationNumber: "MEDIREACH-KARUR-KAR010",
    address: "Government Hospital, Pallapatti, Karur District, Tamil Nadu – 639205",
    latitude: 10.7311,
    longitude: 77.9097,
    totalBeds: 80,
    icuBeds: 4,
    icuAvailable: 2,
    generalAvailable: 1,
    bloodBankCount: 1,
    pharmacyCount: 0,
    laboratoryCount: 0,
    xrayCount: 1,
    ctScanCount: 1,
    mriCount: 1,
    emergencyAvailable: true,
    bloodBankAvailable: false,
  },
  {
    id: "KAR011",
    name: "Government Hospital, Velayuthampalayam",
    registrationNumber: "MEDIREACH-KARUR-KAR011",
    address: "Government Hospital, Velayuthampalayam, Karur District, Tamil Nadu – 639117",
    latitude: 11.08,
    longitude: 78.0003,
    totalBeds: 80,
    icuBeds: 4,
    icuAvailable: 2,
    generalAvailable: 1,
    bloodBankCount: 1,
    pharmacyCount: 0,
    laboratoryCount: 0,
    xrayCount: 1,
    ctScanCount: 1,
    mriCount: 1,
    emergencyAvailable: true,
    bloodBankAvailable: false,
  },
  {
    id: "KAR012",
    name: "Deepa Kannan Hospital",
    registrationNumber: "MEDIREACH-KARUR-KAR012",
    address: "Deepa Kannan Hospital, 33, Muthu Nagar, 1st Cross Road, Ramakrishnapuram, Karur, Tamil Nadu – 639002",
    latitude: 10.948,
    longitude: 78.07,
    totalBeds: 60,
    icuBeds: 6,
    icuAvailable: 3,
    generalAvailable: 2,
    bloodBankCount: 1,
    pharmacyCount: 1,
    laboratoryCount: 1,
    xrayCount: 1,
    ctScanCount: 1,
    mriCount: 1,
    emergencyAvailable: true,
    bloodBankAvailable: true,
  },
  {
    id: "KAR013",
    name: "Renuka Multispeciality Hospital",
    registrationNumber: "MEDIREACH-KARUR-KAR013",
    address: "Renuka Multispeciality Hospital, Renganayakipuram Road, Renganayaki Puram, Karur, Tamil Nadu – 639002",
    latitude: 10.955,
    longitude: 78.09,
    totalBeds: 50,
    icuBeds: 5,
    icuAvailable: 3,
    generalAvailable: 2,
    bloodBankCount: 1,
    pharmacyCount: 1,
    laboratoryCount: 1,
    xrayCount: 1,
    ctScanCount: 1,
    mriCount: 1,
    emergencyAvailable: true,
    bloodBankAvailable: true,
  },
  {
    id: "KAR014",
    name: "Amirthaa Medical Centre & Hospital",
    registrationNumber: "MEDIREACH-KARUR-KAR014",
    // Sheet only had "Thanthoni, Karur, Tamil Nadu" — completed via web search:
    // https://amirthaahospital.com/about.html
    address: "16, Dindigul Main Road, Bharathidasan Nagar, Thanthonimalai, Karur, Tamil Nadu – 639007",
    latitude: 10.975,
    longitude: 78.095,
    totalBeds: 60,
    icuBeds: 5,
    icuAvailable: 3,
    generalAvailable: 2,
    bloodBankCount: 1,
    pharmacyCount: 1,
    laboratoryCount: 1,
    xrayCount: 1,
    ctScanCount: 1,
    mriCount: 1,
    emergencyAvailable: true,
    bloodBankAvailable: true,
  },
  {
    id: "KAR015",
    name: "ARS Hospital",
    registrationNumber: "MEDIREACH-KARUR-KAR015",
    address: "ARS Hospital, Thanthonimalai Road, Kamaraj Nagar, Sungagate, Karur, Tamil Nadu – 639005",
    latitude: 10.97,
    longitude: 78.085,
    totalBeds: 40,
    icuBeds: 4,
    icuAvailable: 4,
    generalAvailable: 2,
    bloodBankCount: 1,
    pharmacyCount: 1,
    laboratoryCount: 0,
    xrayCount: 1,
    ctScanCount: 1,
    mriCount: 1,
    emergencyAvailable: true,
    bloodBankAvailable: true,
  },
  {
    id: "KAR016",
    name: "SG Hospital",
    registrationNumber: "MEDIREACH-KARUR-KAR016",
    address: "SG Hospital, 80 Feet Road, Gandhi Puram, Karur, Tamil Nadu – 639002",
    latitude: 10.96,
    longitude: 78.07,
    totalBeds: 50,
    icuBeds: 4,
    icuAvailable: 2,
    generalAvailable: 2,
    bloodBankCount: 1,
    pharmacyCount: 1,
    laboratoryCount: 0,
    xrayCount: 1,
    ctScanCount: 1,
    mriCount: 1,
    emergencyAvailable: true,
    bloodBankAvailable: true,
  },
  {
    id: "KAR017",
    name: "Raj Ortho Hospital",
    registrationNumber: "MEDIREACH-KARUR-KAR017",
    // Sheet only had "Karur, Tamil Nadu" — completed via web search:
    // https://www.bajajfinservhealth.in/hospitals/karur/raj-ortho-hospital-gowripuram
    address: "35, West Gowripuram, Karur, Tamil Nadu – 639001",
    latitude: 10.962,
    longitude: 78.072,
    totalBeds: 35,
    icuBeds: 2,
    icuAvailable: 2,
    generalAvailable: 1,
    bloodBankCount: 0,
    pharmacyCount: 0,
    laboratoryCount: 0,
    xrayCount: 1,
    ctScanCount: 1,
    mriCount: 1,
    emergencyAvailable: true,
    bloodBankAvailable: false,
  },
  {
    id: "KAR018",
    name: "Dr G.C. Hospital",
    registrationNumber: "MEDIREACH-KARUR-KAR018",
    // Sheet only had "Karur, Tamil Nadu" — completed via web search:
    // https://gchospital.in/
    address: "31, N Pradakshanam Road, Madavilagam, Karur, Tamil Nadu – 639001",
    latitude: 10.961,
    longitude: 78.074,
    totalBeds: 45,
    icuBeds: 3,
    icuAvailable: 2,
    generalAvailable: 1,
    bloodBankCount: 1,
    pharmacyCount: 1,
    laboratoryCount: 0,
    xrayCount: 1,
    ctScanCount: 1,
    mriCount: 1,
    emergencyAvailable: true,
    bloodBankAvailable: true,
  },
  {
    id: "KAR019",
    name: "Nathan Hospital",
    registrationNumber: "MEDIREACH-KARUR-KAR019",
    // Sheet only had "Karur, Tamil Nadu" — completed via web search:
    // https://nathanhospital.com/contact-us/
    address: "93, Rajaji Street, Anna Arch, Karur, Tamil Nadu – 639001",
    latitude: 10.959,
    longitude: 78.078,
    totalBeds: 45,
    icuBeds: 3,
    icuAvailable: 2,
    generalAvailable: 1,
    bloodBankCount: 1,
    pharmacyCount: 1,
    laboratoryCount: 0,
    xrayCount: 1,
    ctScanCount: 1,
    mriCount: 1,
    emergencyAvailable: true,
    bloodBankAvailable: false,
  },
  {
    id: "KAR020",
    name: "Somasundaram Eye Hospital",
    registrationNumber: "MEDIREACH-KARUR-KAR020",
    // Sheet only had "Karur, Tamil Nadu" — completed via web search:
    // https://www.somasundarameyehospital.com/
    address: "21, Coimbatore Road, Sengunthapuram, Karur, Tamil Nadu – 639002",
    latitude: 10.96,
    longitude: 78.073,
    totalBeds: 30,
    icuBeds: 2,
    icuAvailable: 1,
    generalAvailable: 0,
    bloodBankCount: 0,
    pharmacyCount: 0,
    laboratoryCount: 0,
    xrayCount: 1,
    ctScanCount: 1,
    mriCount: 1,
    emergencyAvailable: false, // eye-specialty hospital — no general emergency service
    bloodBankAvailable: false,
  },
];

interface DoctorSeed {
  hospitalId: string;
  name: string;
  specialization: string;
  experienceYears: number | null;
}

const doctors: DoctorSeed[] = [
  // --- KAR002 Apollo Hospitals, Karur — verified public listing ---
  { hospitalId: "KAR002", name: "Dr Revathy G", specialization: "Pathology", experienceYears: 22 },
  { hospitalId: "KAR002", name: "Dr Sridhar K", specialization: "ENT", experienceYears: 16 },
  { hospitalId: "KAR002", name: "Dr Saravanan P", specialization: "Neurology / Neurosciences", experienceYears: 11 },
  { hospitalId: "KAR002", name: "Dr Murugesan K", specialization: "General Surgery", experienceYears: 10 },
  { hospitalId: "KAR002", name: "Dr Udhayakumari T", specialization: "Obstetrics & Gynecology", experienceYears: 8 },
  { hospitalId: "KAR002", name: "Dr Senthilmuthu K", specialization: "Internal Medicine", experienceYears: 6 },
  { hospitalId: "KAR002", name: "Dr Suganya S", specialization: "Radiology", experienceYears: 6 },
  { hospitalId: "KAR002", name: "Dr Kesavan S", specialization: "Cardiology", experienceYears: 5 },
  { hospitalId: "KAR002", name: "Dr Iswarya A", specialization: "Anaesthesiology", experienceYears: 4 },
  { hospitalId: "KAR002", name: "Dr Divya Gokul", specialization: "Internal Medicine", experienceYears: 3 },
  { hospitalId: "KAR002", name: "Dr Mahudeswaran R", specialization: "General Surgery", experienceYears: 2 },

  // --- KAR003 Amaravathi Hospital — verified hospital website, experience not published ---
  { hospitalId: "KAR003", name: "Dr N. Velusamy", specialization: "General Medicine", experienceYears: null },
  { hospitalId: "KAR003", name: "Dr G. Karthick", specialization: "Pulmonology", experienceYears: null },
  { hospitalId: "KAR003", name: "Dr Rajendran", specialization: "Orthopaedics", experienceYears: null },
  { hospitalId: "KAR003", name: "Dr Raj Nihedan", specialization: "Surgical Gastroenterology", experienceYears: null },
  { hospitalId: "KAR003", name: "Dr Kesavan", specialization: "Cardiology", experienceYears: null },
  { hospitalId: "KAR003", name: "Dr V. Sankar", specialization: "Gastroenterology", experienceYears: null },
  { hospitalId: "KAR003", name: "Dr C. Suresh", specialization: "Oncology", experienceYears: null },
  { hospitalId: "KAR003", name: "Dr Karthikeyan", specialization: "Emergency Medicine", experienceYears: null },
  { hospitalId: "KAR003", name: "Dr Manokaran", specialization: "Nephrology", experienceYears: null },
  { hospitalId: "KAR003", name: "Dr Krishnaprasad", specialization: "Neurology", experienceYears: null },
  { hospitalId: "KAR003", name: "Dr K. Aruljothi", specialization: "General Surgery", experienceYears: null },
  { hospitalId: "KAR003", name: "Dr S. Prabakaran", specialization: "ENT", experienceYears: null },
  { hospitalId: "KAR003", name: "Dr T. Poovendran", specialization: "Urology", experienceYears: null },

  // --- KAR004 Vijay Hospital — verified hospital website, experience not published ---
  { hospitalId: "KAR004", name: "Dr P. Manimegalai", specialization: "General Medicine", experienceYears: null },
  { hospitalId: "KAR004", name: "Dr T. Vijithra", specialization: "Obstetrics & Gynaecology", experienceYears: null },
  { hospitalId: "KAR004", name: "Dr C. Shanmugam", specialization: "Emergency Medicine", experienceYears: null },
  { hospitalId: "KAR004", name: "Dr S. Karthik", specialization: "Urology / Andrology", experienceYears: null },
  { hospitalId: "KAR004", name: "Dr K. Dakshinamoorthy", specialization: "General & Laparoscopic Surgery", experienceYears: null },
  { hospitalId: "KAR004", name: "Dr P. M. Nithya Bharathi", specialization: "Anaesthesiology", experienceYears: null },
  { hospitalId: "KAR004", name: "Dr M. Subhanandhini", specialization: "Radiology", experienceYears: null },
  { hospitalId: "KAR004", name: "Dr Manikandan", specialization: "Cardiology", experienceYears: null },

  // --- Everything below: synthetic doctors. The source sheet literally named these
  // "Dr Demo 001-1" etc. — given ordinary fictional names here per explicit user direction,
  // specialty kept from the sheet. Not real people. ---
  { hospitalId: "KAR001", name: "Dr. Karthik R", specialization: "General Medicine", experienceYears: null },
  { hospitalId: "KAR001", name: "Dr. Priya S", specialization: "General Surgery", experienceYears: null },
  { hospitalId: "KAR001", name: "Dr. Suresh Kumar", specialization: "Cardiology", experienceYears: null },
  { hospitalId: "KAR001", name: "Dr. Lakshmi Narayanan", specialization: "Orthopaedics", experienceYears: null },
  { hospitalId: "KAR001", name: "Dr. Bhuvaneswari M", specialization: "Pediatrics", experienceYears: null },
  { hospitalId: "KAR001", name: "Dr. Ganesan T", specialization: "Obstetrics & Gynaecology", experienceYears: null },
  { hospitalId: "KAR001", name: "Dr. Meena Sundaram", specialization: "ENT", experienceYears: null },
  { hospitalId: "KAR001", name: "Dr. Rajesh Babu", specialization: "Ophthalmology", experienceYears: null },

  { hospitalId: "KAR005", name: "Dr. Kavitha R", specialization: "General Medicine", experienceYears: null },
  { hospitalId: "KAR005", name: "Dr. Muthu Vel", specialization: "General Surgery", experienceYears: null },
  { hospitalId: "KAR005", name: "Dr. Anitha K", specialization: "Pediatrics", experienceYears: null },
  { hospitalId: "KAR005", name: "Dr. Selvam P", specialization: "Obstetrics & Gynaecology", experienceYears: null },

  { hospitalId: "KAR006", name: "Dr. Deepa R", specialization: "General Medicine", experienceYears: null },
  { hospitalId: "KAR006", name: "Dr. Balamurugan S", specialization: "General Surgery", experienceYears: null },
  { hospitalId: "KAR006", name: "Dr. Nithya K", specialization: "Obstetrics & Gynaecology", experienceYears: null },

  { hospitalId: "KAR007", name: "Dr. Manoj Kumar", specialization: "General Medicine", experienceYears: null },
  { hospitalId: "KAR007", name: "Dr. Vasanthi M", specialization: "General Surgery", experienceYears: null },
  { hospitalId: "KAR007", name: "Dr. Prakash Raj", specialization: "Pediatrics", experienceYears: null },

  { hospitalId: "KAR008", name: "Dr. Sangeetha V", specialization: "General Medicine", experienceYears: null },
  { hospitalId: "KAR008", name: "Dr. Elango S", specialization: "General Surgery", experienceYears: null },
  { hospitalId: "KAR008", name: "Dr. Radha Krishnan", specialization: "Obstetrics & Gynaecology", experienceYears: null },

  { hospitalId: "KAR009", name: "Dr. Saranya M", specialization: "General Medicine", experienceYears: null },
  { hospitalId: "KAR009", name: "Dr. Dinesh Kumar", specialization: "Pediatrics", experienceYears: null },
  { hospitalId: "KAR009", name: "Dr. Uma Maheswari", specialization: "Obstetrics & Gynaecology", experienceYears: null },

  { hospitalId: "KAR010", name: "Dr. Vignesh S", specialization: "General Medicine", experienceYears: null },
  { hospitalId: "KAR010", name: "Dr. Kalaivani R", specialization: "General Surgery", experienceYears: null },
  { hospitalId: "KAR010", name: "Dr. Arun Prasad", specialization: "Pediatrics", experienceYears: null },

  { hospitalId: "KAR011", name: "Dr. Jothi Lakshmi", specialization: "General Medicine", experienceYears: null },
  { hospitalId: "KAR011", name: "Dr. Senthil Nathan", specialization: "Orthopaedics", experienceYears: null },
  { hospitalId: "KAR011", name: "Dr. Revathi K", specialization: "Obstetrics & Gynaecology", experienceYears: null },

  { hospitalId: "KAR012", name: "Dr. Selvaraj M", specialization: "Cardiology", experienceYears: null },
  { hospitalId: "KAR012", name: "Dr. Padma Priya", specialization: "General Medicine", experienceYears: null },
  { hospitalId: "KAR012", name: "Dr. Ravi Shankar", specialization: "General Surgery", experienceYears: null },

  { hospitalId: "KAR013", name: "Dr. Geetha M", specialization: "Obstetrics & Gynaecology", experienceYears: null },
  { hospitalId: "KAR013", name: "Dr. Naveen Kumar", specialization: "General Medicine", experienceYears: null },
  { hospitalId: "KAR013", name: "Dr. Shanthi R", specialization: "General Surgery", experienceYears: null },

  { hospitalId: "KAR014", name: "Dr. Pandiyan S", specialization: "General Medicine", experienceYears: null },
  { hospitalId: "KAR014", name: "Dr. Vidya Sagar", specialization: "Dental", experienceYears: null },
  { hospitalId: "KAR014", name: "Dr. Malathi K", specialization: "General Surgery", experienceYears: null },

  { hospitalId: "KAR015", name: "Dr. Sathish Kumar", specialization: "Pediatrics", experienceYears: null },
  { hospitalId: "KAR015", name: "Dr. Kokila R", specialization: "Neonatology", experienceYears: null },
  { hospitalId: "KAR015", name: "Dr. Anand Babu", specialization: "Pediatric Surgery", experienceYears: null },

  { hospitalId: "KAR016", name: "Dr. Swathi M", specialization: "Obstetrics & Gynaecology", experienceYears: null },
  { hospitalId: "KAR016", name: "Dr. Gowtham S", specialization: "Pediatrics", experienceYears: null },
  { hospitalId: "KAR016", name: "Dr. Rekha Devi", specialization: "General Medicine", experienceYears: null },

  { hospitalId: "KAR017", name: "Dr. Karunanidhi V", specialization: "Orthopaedics", experienceYears: null },

  { hospitalId: "KAR018", name: "Dr. Poornima S", specialization: "Orthopaedics", experienceYears: null },
  { hospitalId: "KAR018", name: "Dr. Yuvaraj T", specialization: "General Surgery", experienceYears: null },
  { hospitalId: "KAR018", name: "Dr. Chitra M", specialization: "General Medicine", experienceYears: null },

  { hospitalId: "KAR019", name: "Dr. Sivakumar R", specialization: "General Medicine", experienceYears: null },
  { hospitalId: "KAR019", name: "Dr. Divya Bharathi", specialization: "General Surgery", experienceYears: null },

  { hospitalId: "KAR020", name: "Dr. Ashok Kumar", specialization: "Ophthalmology", experienceYears: null },
];

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const hospitalDbId = new Map<string, string>(); // dataset hospital_id -> real hospitals.id

  try {
    for (const h of hospitals) {
      const result = await pool.query<{ id: string }>(
        `INSERT INTO hospitals (
           name, registration_number, address, latitude, longitude, verified, status,
           emergency_status, emergency_status_updated_at
         )
         VALUES ($1, $2, $3, $4, $5, true, 'VERIFIED', $6, now())
         ON CONFLICT (registration_number) DO UPDATE SET
           name = EXCLUDED.name, address = EXCLUDED.address,
           latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
           emergency_status = EXCLUDED.emergency_status, emergency_status_updated_at = now()
         RETURNING id`,
        [h.name, h.registrationNumber, h.address, h.latitude, h.longitude, h.emergencyAvailable ? "AVAILABLE" : "UNAVAILABLE"],
      );
      const hospitalId = result.rows[0].id;
      hospitalDbId.set(h.id, hospitalId);

      const generalTotal = h.totalBeds - h.icuBeds;
      const icuOccupied = Math.max(0, h.icuBeds - h.icuAvailable);
      const generalOccupied = Math.max(0, generalTotal - h.generalAvailable);

      await pool.query(
        `INSERT INTO beds (hospital_id, bed_type, total_beds, occupied_beds)
         VALUES ($1, 'ICU', $2, $3), ($1, 'GENERAL', $4, $5)
         ON CONFLICT (hospital_id, bed_type) DO UPDATE SET total_beds = EXCLUDED.total_beds, occupied_beds = EXCLUDED.occupied_beds`,
        [hospitalId, h.icuBeds, icuOccupied, generalTotal, generalOccupied],
      );

      const facilityRows: [string, string, number | null][] = [];
      if (h.bloodBankCount > 0) facilityRows.push(["BLOOD_BANK", h.bloodBankAvailable ? "AVAILABLE" : "UNAVAILABLE", h.bloodBankCount]);
      if (h.pharmacyCount > 0) facilityRows.push(["PHARMACY", "AVAILABLE", null]);
      if (h.laboratoryCount > 0) facilityRows.push(["LABORATORY", "AVAILABLE", null]);
      if (h.xrayCount > 0) facilityRows.push(["XRAY", "AVAILABLE", h.xrayCount]);
      if (h.ctScanCount > 0) facilityRows.push(["CT_SCAN", "AVAILABLE", h.ctScanCount]);
      if (h.mriCount > 0) facilityRows.push(["MRI", "AVAILABLE", h.mriCount]);

      for (const [facilityName, status, quantity] of facilityRows) {
        await pool.query(
          `INSERT INTO facilities (hospital_id, facility_name, status, quantity)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (hospital_id, facility_name) DO UPDATE SET status = EXCLUDED.status, quantity = EXCLUDED.quantity`,
          [hospitalId, facilityName, status, quantity],
        );
      }
    }

    let doctorsInserted = 0;
    for (const d of doctors) {
      const hospitalId = hospitalDbId.get(d.hospitalId);
      if (!hospitalId) continue;

      const existing = await pool.query<{ id: string }>(
        `SELECT id FROM doctors WHERE hospital_id = $1 AND name = $2`,
        [hospitalId, d.name],
      );
      if (!existing.rows[0]) {
        await pool.query(
          `INSERT INTO doctors (hospital_id, name, specialization, experience_years)
           VALUES ($1, $2, $3, $4)`,
          [hospitalId, d.name, d.specialization, d.experienceYears],
        );
        doctorsInserted++;
      }
    }

    console.log(`Seeded ${hospitals.length} Karur district hospitals (1 enriched, ${hospitals.length - 1} new) and ${doctorsInserted} doctors.`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Karur dataset seeding failed:", err);
  process.exit(1);
});
