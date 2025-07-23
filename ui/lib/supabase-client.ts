import { supabase } from './supabase';
import type { 
  User,
  Proposal,
  Stakeholder,
  Approval,
  UserRole,
  ProposalStatus,
  StakeholderStatus,
  ApprovalStatus 
} from '@/types/database.types';

// Auth functions
export const auth = {
  signUp: async (email: string, password: string, name: string, role: UserRole = 'STAKEHOLDER') => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    // Create user profile
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          name,
          password: 'hashed_by_supabase', // Supabase handles password hashing
          role,
        });

      if (profileError) throw profileError;
    }

    return authData;
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  getUserProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data as User;
  },
};

// Proposals functions
export const proposals = {
  create: async (proposal: Omit<Proposal, 'id' | 'created_at' | 'updated_at'>) => {
    console.log('Creating proposal with data:', proposal);
    console.log('Current user session:', await supabase.auth.getSession());
    
    // Test minimal insert first
    const minimalProposal = {
      product_name: proposal.product_name,
      current_cost: proposal.current_cost,
      category: proposal.category,
      formulation: proposal.formulation,
      status: proposal.status,
      created_by: proposal.created_by,
      business_objectives: proposal.business_objectives || [],
      priority_objectives: proposal.priority_objectives || [],
      constraints: proposal.constraints || {},
      acceptable_changes: proposal.acceptable_changes || [],
      not_acceptable_changes: proposal.not_acceptable_changes || [],
      feasibility_limits: proposal.feasibility_limits || []
    };
    
    console.log('Minimal proposal data:', minimalProposal);
    
    const { data, error } = await supabase
      .from('proposals')
      .insert(minimalProposal)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        statusCode: error.statusCode,
        status: error.status
      });
      
      // Additional debugging for RLS issues
      if (error.code === '42501' || error.message?.includes('policy')) {
        console.error('RLS Policy violation detected');
        const user = await supabase.auth.getUser();
        console.error('Current auth user:', user);
      }
      
      throw new Error(`Failed to create proposal: ${error.message || 'Unknown error'}`);
    }
    
    if (!data) {
      throw new Error('No data returned from proposal creation');
    }
    
    return data as Proposal;
  },

  update: async (id: string, updates: Partial<Proposal>) => {
    const { data, error } = await supabase
      .from('proposals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Proposal;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('proposals')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('proposals')
      .select(`
        *,
        creator:users!created_by(id, name, email),
        stakeholders(
          *,
          user:users(id, name, email)
        ),
        approvals(
          *,
          user:users(id, name, email)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  list: async (filters?: { status?: ProposalStatus; created_by?: string }) => {
    let query = supabase
      .from('proposals')
      .select(`
        *,
        creator:users!created_by(id, name, email),
        stakeholders(count),
        approvals(count)
      `);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.created_by) {
      query = query.eq('created_by', filters.created_by);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get proposals where user is a stakeholder
  getAsStakeholder: async (userId: string) => {
    const { data, error } = await supabase
      .from('proposals')
      .select(`
        *,
        creator:users!created_by(id, name, email),
        stakeholders!inner(*)
      `)
      .eq('stakeholders.user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },
};

// Stakeholders functions
export const stakeholders = {
  add: async (proposalId: string, userId: string) => {
    const { data, error } = await supabase
      .from('stakeholders')
      .insert({
        proposal_id: proposalId,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Stakeholder;
  },

  remove: async (id: string) => {
    const { error } = await supabase
      .from('stakeholders')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  updateStatus: async (id: string, status: StakeholderStatus, comments?: string) => {
    const { data, error } = await supabase
      .from('stakeholders')
      .update({
        status,
        comments,
        responded_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Stakeholder;
  },

  getByProposal: async (proposalId: string) => {
    const { data, error } = await supabase
      .from('stakeholders')
      .select(`
        *,
        user:users(id, name, email, role)
      `)
      .eq('proposal_id', proposalId);

    if (error) throw error;
    return data;
  },
};

// Approvals functions
export const approvals = {
  submit: async (proposalId: string, userId: string, status: ApprovalStatus, comments?: string) => {
    const { data, error } = await supabase
      .from('approvals')
      .insert({
        proposal_id: proposalId,
        user_id: userId,
        status,
        comments,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Approval;
  },

  update: async (id: string, status: ApprovalStatus, comments?: string) => {
    const { data, error } = await supabase
      .from('approvals')
      .update({
        status,
        comments,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Approval;
  },

  getByProposal: async (proposalId: string) => {
    const { data, error } = await supabase
      .from('approvals')
      .select(`
        *,
        user:users(id, name, email, role)
      `)
      .eq('proposal_id', proposalId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  getUserApproval: async (proposalId: string, userId: string) => {
    const { data, error } = await supabase
      .from('approvals')
      .select('*')
      .eq('proposal_id', proposalId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
    return data as Approval | null;
  },
};

// Real-time subscriptions
export const subscriptions = {
  onProposalChange: (proposalId: string, callback: (payload: any) => void) => {
    const channel = supabase
      .channel(`proposal-${proposalId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'proposals',
          filter: `id=eq.${proposalId}`,
        },
        callback
      )
      .subscribe();

    return channel;
  },

  onStakeholderChange: (proposalId: string, callback: (payload: any) => void) => {
    const channel = supabase
      .channel(`stakeholders-${proposalId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stakeholders',
          filter: `proposal_id=eq.${proposalId}`,
        },
        callback
      )
      .subscribe();

    return channel;
  },

  onApprovalChange: (proposalId: string, callback: (payload: any) => void) => {
    const channel = supabase
      .channel(`approvals-${proposalId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'approvals',
          filter: `proposal_id=eq.${proposalId}`,
        },
        callback
      )
      .subscribe();

    return channel;
  },

  unsubscribe: (channel: any) => {
    supabase.removeChannel(channel);
  },
};

// Utility functions
export const utils = {
  searchUsers: async (query: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(10);

    if (error) throw error;
    return data;
  },

  getProposalStats: async () => {
    const { data, error } = await supabase
      .from('proposals')
      .select('status')
      .then(({ data, error }) => {
        if (error) throw error;
        
        const stats = {
          total: data?.length || 0,
          draft: 0,
          pending_approval: 0,
          approved: 0,
          rejected: 0,
          changes_requested: 0,
        };

        data?.forEach((proposal) => {
          stats[proposal.status.toLowerCase() as keyof typeof stats]++;
        });

        return stats;
      });

    return data;
  },
};