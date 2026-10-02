/**
 * Mock payloads for Gym Management System API endpoints.
 * Usable for testing with Bruno, Postman, Jest, or seed scripts.
 */

export const MOCK_PAYLOADS = {
  // /api/auth
  auth: {
    register: {
      name: "Admin User",
      email: "admin@fitlife.com",
      password: "password123",
      role: "ADMIN",
    },
    registerStaff: {
      name: "Staff Member",
      email: "staff@fitlife.com",
      password: "password123",
      role: "STAFF",
    },
    login: {
      email: "admin@fitlife.com",
      password: "password123",
    },
    forgotPasswordDirect: {
      email: "admin@fitlife.com",
      newPassword: "newpassword123",
      confirmPassword: "newpassword123",
    },
    forgotPasswordTokenRequest: {
      email: "admin@fitlife.com",
    },
    resetPassword: {
      token: "SAMPLE_RESET_TOKEN_HEX",
      newPassword: "newpassword123",
      confirmPassword: "newpassword123",
    },
  },

  // /api/users
  users: {
    create: {
      name: "Manager Smith",
      email: "smith@fitlife.com",
      password: "password123",
      role: "ADMIN",
      status: "ACTIVE",
    },
    update: {
      name: "Manager Smith Jr.",
      role: "ADMIN",
      status: "ACTIVE",
      password: "updatedpassword123",
    },
  },

  // POST /api/members
  members: {
    create: {
      name: "Alex Johnson",
      email: "alex.johnson@example.com",
      phone: "+1-555-019-2834",
      address: "742 Evergreen Terrace, Springfield",
      gender: "male",
      date_of_birth: "1995-06-15",
      membership_type: "Annual Premium",
    },
    createAlternative: {
      name: "Sarah Connor",
      email: "sarah.connor@example.com",
      phone: "+1-555-082-9104",
      address: "1200 Grand Ave, Los Angeles, CA",
      gender: "female",
      date_of_birth: "1998-11-20",
      membership_type: "Monthly Basic",
    },
    update: {
      phone: "+1-555-999-8888",
      address: "88 Ocean Drive, Miami, FL",
      membership_type: "VIP Platinum",
    },
  },

  // POST /api/trainers
  trainers: {
    create: {
      name: "Marcus Vance",
      email: "marcus.vance@fitlife.com",
      phone: "+1-555-482-9912",
      address: "404 Ironwood Drive, Austin, TX",
      gender: "male",
      date_of_birth: "1990-04-12",
      specialization: [
        "Strength & Conditioning",
        "Powerlifting",
        "Bodybuilding",
      ],
      experience: 8,
      shift: ["Morning (06:00 - 14:00)", "Afternoon (14:00 - 22:00)"],
    },
    createAlternative: {
      name: "Elena Rostova",
      email: "elena.rostova@fitlife.com",
      phone: "+1-555-731-6284",
      address: "88 Sunset Blvd, Los Angeles, CA",
      gender: "female",
      date_of_birth: "1994-09-25",
      specialization: ["HIIT", "Functional Mobility", "Sports Nutrition"],
      experience: 5,
      shift: ["Morning (06:00 - 12:00)"],
    },
    update: {
      specialization: ["Rehabilitation", "Yoga", "Mobility"],
      experience: 6,
      shift: ["Evening (16:00 - 22:00)"],
    },
  },

  // POST /api/membership-plans
  membershipPlans: {
    create: {
      plan_name: "Annual Premium",
      duration_in_days: 365,
      price: 599.99,
      description: "Full access to gym, sauna, pool, and locker rooms",
    },
    createAlternative: {
      plan_name: "Monthly Basic",
      duration_in_days: 30,
      price: 49.99,
      description: "Access to gym equipment during standard hours",
    },
    update: {
      price: 549.99,
      description: "Discounted annual plan",
    },
  },

  // POST /api/memberships
  memberships: {
    create: {
      member_id: "66f001122334455667788990", // Replace with actual member _id
      plan_id: "66f001122334455667788995",   // Replace with actual plan _id
      payment_method: "CREDIT_CARD",
      amount: 599.99,
      payment_status: "PAID",
      payment_date: "2026-09-23T00:00:00.000Z",
    },
    createAlternative: {
      member_id: "66f001122334455667788991",
      plan_id: "66f001122334455667788996",
      payment_method: "CASH",
      amount: 49.99,
      payment_status: "PENDING",
      payment_date: "2026-09-23T00:00:00.000Z",
    },
    update: {
      payment_status: "PAID",
    },
  },

  // POST /api/training-sessions
  trainingSessions: {
    create: {
      memberId: "66f001122334455667788990", // Replace with an actual member _id
      trainerId: "66f112233445566778899001", // Replace with an actual trainer _id
      date: "2026-10-05T00:00:00.000Z",
      startTime: "09:00",
      duration: 60,
      status: "SCHEDULED",
    },
    createAlternative: {
      memberId: "66f001122334455667788991", // Replace with an actual member _id
      trainerId: "66f112233445566778899001", // Replace with an actual trainer _id
      date: "2026-10-06T00:00:00.000Z",
      startTime: "14:30",
      duration: 45,
      status: "SCHEDULED",
    },
    update: {
      startTime: "10:00",
      duration: 60,
      status: "COMPLETED",
    },
  },
};

export default MOCK_PAYLOADS;
