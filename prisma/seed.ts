import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Every seeded account uses this password (dev only).
const DEMO_PASSWORD = "password123";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // Clear in FK-safe order (idempotent re-seed).
  await prisma.redemption.deleteMany();
  await prisma.mealCoupon.deleteMany();
  await prisma.exitRequest.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.roleAssignment.deleteMany();
  await prisma.member.deleteMany();
  await prisma.counter.deleteMany();

  // --- Cafeteria counter (rotating presence-anchor code is derived from this secret) ---
  const counter = await prisma.counter.create({
    data: { name: "Main Hall Counter 1", outlet: "OUTLET-MAIN", secret: "counter-main-secret" },
  });

  type Seed = {
    memberType: string;
    fullName: string;
    campusId: string;
    email: string;
    status?: string;
    allergyInfo?: string;
    dormId?: string;
    roles: { role: string; scopeType?: string; scopeId?: string }[];
  };

  const members: Seed[] = [
    {
      memberType: "STUDENT",
      fullName: "Andi Pratama",
      campusId: "20210001",
      email: "andi@student.jiu.ac",
      dormId: "DORM-A",
      allergyInfo: "Peanuts, shellfish",
      roles: [{ role: "STUDENT" }],
    },
    {
      memberType: "STUDENT",
      fullName: "Bunga Sari",
      campusId: "20210002",
      email: "bunga@student.jiu.ac",
      dormId: "DORM-A",
      allergyInfo: null as unknown as string,
      roles: [{ role: "STUDENT" }],
    },
    {
      memberType: "STUDENT",
      fullName: "Citra Dewi",
      campusId: "20210003",
      email: "citra@student.jiu.ac",
      dormId: "DORM-B",
      roles: [{ role: "STUDENT" }],
    },
    {
      memberType: "STUDENT",
      fullName: "Eko Suspended",
      campusId: "20210004",
      email: "eko@student.jiu.ac",
      status: "SUSPENDED",
      dormId: "DORM-A",
      roles: [{ role: "STUDENT" }],
    },
    {
      memberType: "FACULTY",
      fullName: "Dr. Dewa Nugraha",
      campusId: "FAC-1001",
      email: "dewa@jiu.ac",
      roles: [{ role: "FACULTY" }],
    },
    {
      memberType: "FACULTY",
      fullName: "Rina — Cafeteria Admin",
      campusId: "FAC-2001",
      email: "rina.cafe@jiu.ac",
      roles: [{ role: "CAFETERIA_ADMIN", scopeType: "OUTLET", scopeId: "OUTLET-MAIN" }],
    },
    {
      memberType: "FACULTY",
      fullName: "Budi — Dorm A Admin",
      campusId: "FAC-3001",
      email: "budi.dorm@jiu.ac",
      roles: [{ role: "DORMITORY_ADMIN", scopeType: "DORM", scopeId: "DORM-A" }],
    },
    {
      memberType: "FACULTY",
      fullName: "Sari — Academic Admin",
      campusId: "FAC-4001",
      email: "sari.acad@jiu.ac",
      roles: [{ role: "ACADEMIC_ADMIN" }],
    },
  ];

  const created: Record<string, string> = {};
  for (const m of members) {
    const member = await prisma.member.create({
      data: {
        memberType: m.memberType,
        fullName: m.fullName,
        campusId: m.campusId,
        email: m.email,
        status: m.status ?? "ACTIVE",
        allergyInfo: m.allergyInfo ?? null,
        dormId: m.dormId ?? null,
        passwordHash,
        roleAssignments: {
          create: m.roles.map((r) => ({
            role: r.role,
            scopeType: r.scopeType ?? null,
            scopeId: r.scopeId ?? null,
          })),
        },
      },
    });
    created[m.email] = member.id;
  }

  // A pending exit request in DORM-A so the Dorm A admin has something to review immediately.
  await prisma.exitRequest.create({
    data: {
      memberId: created["bunga@student.jiu.ac"],
      dormId: "DORM-A",
      destination: "Family home — weekend visit",
      departureAt: new Date(Date.now() + 24 * 3600 * 1000),
      returnAt: new Date(Date.now() + 3 * 24 * 3600 * 1000),
      status: "PENDING",
    },
  });

  console.log("\n✅ Seed complete.\n");
  console.log(`   Cafeteria counter: ${counter.name} (${counter.outlet})`);
  console.log(`   All accounts use password: ${DEMO_PASSWORD}\n`);
  console.log("   Login accounts:");
  console.log("   • andi@student.jiu.ac      STUDENT (Dorm A, has allergies)");
  console.log("   • bunga@student.jiu.ac     STUDENT (Dorm A)");
  console.log("   • citra@student.jiu.ac     STUDENT (Dorm B)");
  console.log("   • eko@student.jiu.ac       STUDENT (SUSPENDED — login is blocked)");
  console.log("   • dewa@jiu.ac              FACULTY");
  console.log("   • rina.cafe@jiu.ac         CAFETERIA_ADMIN (Outlet Main)");
  console.log("   • budi.dorm@jiu.ac         DORMITORY_ADMIN (Dorm A)");
  console.log("   • sari.acad@jiu.ac         ACADEMIC_ADMIN\n");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
