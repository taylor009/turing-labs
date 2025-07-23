// Seed data script for Supabase
// Run this script to populate your database with test data

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../ui/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test users
const testUsers = [
  {
    email: 'admin@example.com',
    password: 'admin123456',
    name: 'Admin User',
    role: 'ADMIN'
  },
  {
    email: 'pm@example.com',
    password: 'pm123456',
    name: 'Product Manager',
    role: 'PRODUCT_MANAGER'
  },
  {
    email: 'stakeholder1@example.com',
    password: 'stake123456',
    name: 'John Stakeholder',
    role: 'STAKEHOLDER'
  },
  {
    email: 'stakeholder2@example.com',
    password: 'stake123456',
    name: 'Jane Stakeholder',
    role: 'STAKEHOLDER'
  }
];

// Test proposals
const testProposals = [
  {
    product_name: 'Premium Dark Chocolate Bar',
    current_cost: 2.45,
    category: 'Premium Confectionery',
    formulation: '70% cocoa, organic cane sugar, cocoa butter, vanilla extract, lecithin',
    status: 'PENDING_APPROVAL',
    business_objectives: [
      'Reduce manufacturing cost by 10-15%',
      'Maintain premium taste profile',
      'Preserve brand positioning'
    ],
    priority_objectives: [
      { objective: 'Reduce manufacturing cost by 10-15%', priority: 'HIGH' },
      { objective: 'Maintain premium taste profile', priority: 'HIGH' },
      { objective: 'Preserve brand positioning', priority: 'MEDIUM' }
    ],
    constraints: {
      'Technical Requirements': [
        'Storage temperature must remain between 15-20°C',
        'Minimum 12-month shelf life required'
      ],
      'Regulatory Compliance': [
        'All ingredients must be FDA approved',
        'Must meet organic certification standards'
      ]
    },
    acceptable_changes: [
      'Alternative sweeteners (stevia, erythritol)',
      'Modified cocoa percentage (65-75%)',
      'Different vanilla source'
    ],
    not_acceptable_changes: [
      'Artificial flavors or preservatives',
      'Non-organic ingredients',
      'Reduction in cocoa percentage below 65%'
    ],
    feasibility_limits: [
      'Equipment retrofit cost < $50,000',
      'Ingredient availability in 10,000kg+ quantities',
      'No increase in production time'
    ]
  },
  {
    product_name: 'Organic Granola Mix',
    current_cost: 1.85,
    category: 'Breakfast Foods',
    formulation: 'Rolled oats, honey, almonds, dried cranberries, coconut oil, cinnamon',
    status: 'DRAFT',
    business_objectives: [
      'Reduce cost by 20%',
      'Maintain organic certification',
      'Improve nutritional profile'
    ],
    priority_objectives: [
      { objective: 'Reduce cost by 20%', priority: 'HIGH' },
      { objective: 'Maintain organic certification', priority: 'HIGH' },
      { objective: 'Improve nutritional profile', priority: 'LOW' }
    ],
    constraints: {
      'Nutritional': [
        'Protein content must remain above 5g per serving',
        'Sugar content cannot exceed 10g per serving'
      ],
      'Supply Chain': [
        'All suppliers must be certified organic',
        'Ingredients must have 6+ month shelf life'
      ]
    },
    acceptable_changes: [
      'Alternative nuts (cashews, walnuts)',
      'Different dried fruits',
      'Alternative binding agents'
    ],
    not_acceptable_changes: [
      'Non-organic ingredients',
      'Artificial sweeteners',
      'Preservatives'
    ],
    feasibility_limits: [
      'Supplier lead time < 30 days',
      'Minimum order quantities achievable',
      'Compatible with current packaging line'
    ]
  }
];

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create users
    console.log('Creating users...');
    const createdUsers: any[] = [];
    
    for (const userData of testUsers) {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          name: userData.name,
          role: userData.role
        }
      });

      if (authError) {
        console.error(`Error creating auth user ${userData.email}:`, authError);
        continue;
      }

      // Create user profile
      if (authData.user) {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: userData.email,
            name: userData.name,
            password: 'managed_by_supabase_auth',
            role: userData.role
          })
          .select()
          .single();

        if (profileError) {
          console.error(`Error creating profile for ${userData.email}:`, profileError);
        } else {
          createdUsers.push(profile);
          console.log(`✅ Created user: ${userData.email}`);
        }
      }
    }

    // Create proposals
    console.log('\nCreating proposals...');
    const pmUser = createdUsers.find(u => u.role === 'PRODUCT_MANAGER');
    
    if (pmUser) {
      for (const proposalData of testProposals) {
        const { data: proposal, error: proposalError } = await supabase
          .from('proposals')
          .insert({
            ...proposalData,
            created_by: pmUser.id
          })
          .select()
          .single();

        if (proposalError) {
          console.error('Error creating proposal:', proposalError);
        } else {
          console.log(`✅ Created proposal: ${proposalData.product_name}`);

          // Add stakeholders to the first proposal
          if (proposalData.status === 'PENDING_APPROVAL') {
            const stakeholderUsers = createdUsers.filter(u => u.role === 'STAKEHOLDER');
            
            for (const stakeholder of stakeholderUsers) {
              const { error: stakeholderError } = await supabase
                .from('stakeholders')
                .insert({
                  proposal_id: proposal.id,
                  user_id: stakeholder.id,
                  status: 'PENDING'
                });

              if (stakeholderError) {
                console.error('Error adding stakeholder:', stakeholderError);
              } else {
                console.log(`  → Added stakeholder: ${stakeholder.name}`);
              }
            }

            // Add an approval from one stakeholder
            const approver = stakeholderUsers[0];
            if (approver) {
              const { error: approvalError } = await supabase
                .from('approvals')
                .insert({
                  proposal_id: proposal.id,
                  user_id: approver.id,
                  status: 'APPROVED',
                  comments: 'Looks good, the cost reduction targets are achievable.'
                });

              if (approvalError) {
                console.error('Error adding approval:', approvalError);
              } else {
                console.log(`  → Added approval from: ${approver.name}`);
              }
            }
          }
        }
      }
    }

    console.log('\n✨ Database seeding completed!');
    console.log('\nTest credentials:');
    console.log('----------------');
    testUsers.forEach(user => {
      console.log(`${user.role}: ${user.email} / ${user.password}`);
    });

  } catch (error) {
    console.error('Seeding error:', error);
  }
}

// Run the seed function
seedDatabase();