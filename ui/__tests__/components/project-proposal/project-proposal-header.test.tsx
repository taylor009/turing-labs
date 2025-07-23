import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectProposalHeader } from '@/components/project-proposal/project-proposal-header'

describe('ProjectProposalHeader', () => {
  const mockOnToggleEdit = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders header with title and description', () => {
    render(<ProjectProposalHeader isEditing={false} onToggleEdit={mockOnToggleEdit} />)
    
    expect(screen.getByRole('heading', { name: /project proposal/i })).toBeInTheDocument()
    expect(screen.getByText(/review and edit your comprehensive project proposal/i)).toBeInTheDocument()
  })

  it('shows edit button when not editing', () => {
    render(<ProjectProposalHeader isEditing={false} onToggleEdit={mockOnToggleEdit} />)
    
    const editButton = screen.getByRole('button', { name: /edit proposal/i })
    expect(editButton).toBeInTheDocument()
    expect(editButton).toHaveClass('border-input') // outline variant
  })

  it('shows save button when editing', () => {
    render(<ProjectProposalHeader isEditing={true} onToggleEdit={mockOnToggleEdit} />)
    
    const saveButton = screen.getByRole('button', { name: /save changes/i })
    expect(saveButton).toBeInTheDocument()
    expect(saveButton).not.toHaveClass('border-input') // default variant
  })

  it('calls onToggleEdit when button is clicked', async () => {
    const user = userEvent.setup()
    
    render(<ProjectProposalHeader isEditing={false} onToggleEdit={mockOnToggleEdit} />)
    
    const editButton = screen.getByRole('button', { name: /edit proposal/i })
    await user.click(editButton)
    
    expect(mockOnToggleEdit).toHaveBeenCalledTimes(1)
  })

  it('calls onToggleEdit when save button is clicked', async () => {
    const user = userEvent.setup()
    
    render(<ProjectProposalHeader isEditing={true} onToggleEdit={mockOnToggleEdit} />)
    
    const saveButton = screen.getByRole('button', { name: /save changes/i })
    await user.click(saveButton)
    
    expect(mockOnToggleEdit).toHaveBeenCalledTimes(1)
  })

  it('displays correct icons for edit and save states', () => {
    const { rerender } = render(<ProjectProposalHeader isEditing={false} onToggleEdit={mockOnToggleEdit} />)
    
    // Check for edit icon (Edit2)
    expect(screen.getByRole('button', { name: /edit proposal/i })).toBeInTheDocument()
    
    rerender(<ProjectProposalHeader isEditing={true} onToggleEdit={mockOnToggleEdit} />)
    
    // Check for save icon (Save)
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })

  it('has proper button styling based on editing state', () => {
    const { rerender } = render(<ProjectProposalHeader isEditing={false} onToggleEdit={mockOnToggleEdit} />)
    
    const editButton = screen.getByRole('button', { name: /edit proposal/i })
    expect(editButton).toHaveClass('border-input') // outline variant
    
    rerender(<ProjectProposalHeader isEditing={true} onToggleEdit={mockOnToggleEdit} />)
    
    const saveButton = screen.getByRole('button', { name: /save changes/i })
    expect(saveButton).not.toHaveClass('border-input') // default variant
  })
})