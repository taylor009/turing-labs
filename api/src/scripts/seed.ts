import prisma from '../config/database';
import { user_role, proposal_status } from '../generated/prisma';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash default password for all users
  const defaultPassword = await bcrypt.hash('Password123!', SALT_ROUNDS);

  // Create sample users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@turinglabs.com' },
    update: {},
    create: {
      email: 'admin@turinglabs.com',
      name: 'Admin User',
      password: defaultPassword,
      role: user_role.ADMIN,
    },
  });

  const productManager = await prisma.user.upsert({
    where: { email: 'pm@turinglabs.com' },
    update: {},
    create: {
      email: 'pm@turinglabs.com',
      name: 'Product Manager',
      password: defaultPassword,
      role: user_role.PRODUCT_MANAGER,
    },
  });

  const stakeholder1 = await prisma.user.upsert({
    where: { email: 'sarah.johnson@company.com' },
    update: {},
    create: {
      email: 'sarah.johnson@company.com',
      name: 'Sarah Johnson',
      password: defaultPassword,
      role: user_role.STAKEHOLDER,
    },
  });

  const stakeholder2 = await prisma.user.upsert({
    where: { email: 'mike.chen@company.com' },
    update: {},
    create: {
      email: 'mike.chen@company.com',
      name: 'Mike Chen',
      password: defaultPassword,
      role: user_role.STAKEHOLDER,
    },
  });

  const stakeholder3 = await prisma.user.upsert({
    where: { email: 'lisa.rodriguez@company.com' },
    update: {},
    create: {
      email: 'lisa.rodriguez@company.com',
      name: 'Lisa Rodriguez',
      password: defaultPassword,
      role: user_role.STAKEHOLDER,
    },
  });

  // Create sample proposal
  const sampleProposal = await prisma.proposal.create({
    data: {
      productName: 'Premium Dark Chocolate Bar',
      currentCost: 2.45,
      category: 'Premium Confectionery',
      formulation: '70% cocoa, organic cane sugar, cocoa butter, vanilla extract, lecithin',
      status: proposal_status.PENDING_APPROVAL,
      createdBy: productManager.id,
      businessObjectives: [
        'Reduce manufacturing cost by 10-15%',
        'Maintain premium taste profile',
        'Preserve brand positioning',
        'Ensure regulatory compliance',
        'Maintain shelf stability',
      ],
      priorityObjectives: [
        { objective: 'Cost reduction', priority: 'Priority 1' },
        { objective: 'Taste maintenance', priority: 'Priority 2' },
        { objective: 'Brand consistency', priority: 'Priority 3' },
        { objective: 'Regulatory compliance', priority: 'Priority 4' },
        { objective: 'Shelf stability', priority: 'Priority 5' },
      ],
      constraints: {
        Product: ['Minimum 60% cocoa content', 'No artificial colors', 'Gluten-free requirement'],
        Category: ['Premium market positioning', 'Organic certification preferred'],
        Manufacturing: ['Current equipment compatibility', 'Batch size limitations'],
        Safety: ['Allergen management', 'HACCP compliance'],
        Regulatory: ['FDA approval for new ingredients', 'Organic certification maintenance'],
      },
      acceptableChanges: [
        'Cocoa content adjustment within 5%',
        'Alternative natural sweeteners',
        'Packaging optimization',
        'Supply chain modifications',
      ],
      notAcceptableChanges: [
        'Artificial preservatives',
        'Non-organic ingredients',
        'Significant texture changes',
        'Brand name modifications',
      ],
      feasibilityLimits: [
        'Maximum 20% cost reduction realistic',
        'Minimum 6-month shelf life required',
        'Current production capacity constraints',
        'Seasonal ingredient availability',
      ],
    },
  });

  // Create stakeholder relationships
  await prisma.stakeholder.createMany({
    data: [
      {
        proposalId: sampleProposal.id,
        userId: stakeholder1.id,
        status: 'ACCEPTED',
        respondedAt: new Date(),
      },
      {
        proposalId: sampleProposal.id,
        userId: stakeholder2.id,
        status: 'PENDING',
      },
      {
        proposalId: sampleProposal.id,
        userId: stakeholder3.id,
        status: 'PENDING',
      },
    ],
  });

  // Create sample approvals
  await prisma.approval.create({
    data: {
      proposalId: sampleProposal.id,
      userId: stakeholder1.id,
      status: 'APPROVED',
      comments: 'The proposal looks good from an R&D perspective. The cost reduction targets are achievable.',
    },
  });

  await prisma.approval.create({
    data: {
      proposalId: sampleProposal.id,
      userId: stakeholder3.id,
      status: 'CHANGES_REQUESTED',
      comments: 'Need more details on quality control measures for the new formulation.',
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('Created users:');
  console.log(`  - ${adminUser.name} (${adminUser.email})`);
  console.log(`  - ${productManager.name} (${productManager.email})`);
  console.log(`  - ${stakeholder1.name} (${stakeholder1.email})`);
  console.log(`  - ${stakeholder2.name} (${stakeholder2.email})`);
  console.log(`  - ${stakeholder3.name} (${stakeholder3.email})`);
  console.log(`Created proposal: ${sampleProposal.productName}`);
  console.log('');
  console.log('🔑 Default password for all users: Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });