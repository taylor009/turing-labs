import React from 'react'
import { render, screen } from '@testing-library/react'
import { StakeholderStatus } from '@/components/project-proposal/stakeholder-status'
import { StakeholderStatus as StakeholderStatusType } from '@/types/project-proposal.types'

describe('StakeholderStatus', () => {
  it('renders approved status with correct icon and badge', () => {
    render(<StakeholderStatus status="approved" />)
    
    expect(screen.getByText('Approved')).toBeInTheDocument()
    
    const icon = document.querySelector('.text-green-600')
    expect(icon).toBeInTheDocument()
    
    const badge = screen.getByText('Approved').closest('.bg-green-100')
    expect(badge).toBeInTheDocument()
  })

  it('renders pending status with correct icon and badge', () => {
    render(<StakeholderStatus status="pending" />)
    
    expect(screen.getByText('Pending Review')).toBeInTheDocument()
    
    const icon = document.querySelector('.text-yellow-600')
    expect(icon).toBeInTheDocument()
    
    const badge = screen.getByText('Pending Review').closest('.bg-yellow-100')
    expect(badge).toBeInTheDocument()
  })

  it('renders changes-requested status with correct icon and badge', () => {
    render(<StakeholderStatus status="changes-requested" />)
    
    expect(screen.getByText('Changes Requested')).toBeInTheDocument()
    
    const icon = document.querySelector('.text-red-600')
    expect(icon).toBeInTheDocument()
  })

  it('hides icon when showIcon is false', () => {
    render(<StakeholderStatus status="approved" showIcon={false} />)
    
    expect(screen.getByText('Approved')).toBeInTheDocument()
    
    const icon = document.querySelector('.text-green-600')
    expect(icon).not.toBeInTheDocument()
  })

  it('shows icon by default', () => {
    render(<StakeholderStatus status="approved" />)
    
    const icon = document.querySelector('.text-green-600')
    expect(icon).toBeInTheDocument()
  })

  it('handles all status types correctly', () => {
    const statuses: StakeholderStatusType[] = ['approved', 'pending', 'changes-requested']
    
    statuses.forEach((status) => {
      const { rerender } = render(<StakeholderStatus status={status} />)
      
      switch (status) {
        case 'approved':
          expect(screen.getByText('Approved')).toBeInTheDocument()
          break
        case 'pending':
          expect(screen.getByText('Pending Review')).toBeInTheDocument()
          break
        case 'changes-requested':
          expect(screen.getByText('Changes Requested')).toBeInTheDocument()
          break
      }
      
      rerender(<div />)
    })
  })
})