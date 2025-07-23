import { cn } from '@/lib/utils'

describe('cn utility function', () => {
  it('merges classes correctly', () => {
    const result = cn('px-2 py-1', 'bg-blue-500')
    expect(result).toBe('px-2 py-1 bg-blue-500')
  })

  it('handles conditional classes', () => {
    const result = cn('base-class', true && 'active-class', false && 'inactive-class')
    expect(result).toBe('base-class active-class')
  })

  it('handles undefined and null values', () => {
    const result = cn('base-class', undefined, null, 'other-class')
    expect(result).toBe('base-class other-class')
  })

  it('merges conflicting tailwind classes correctly', () => {
    const result = cn('px-2 px-4', 'py-1 py-2')
    expect(result).toBe('px-4 py-2')
  })

  it('handles arrays of classes', () => {
    const result = cn(['class1', 'class2'], 'class3')
    expect(result).toBe('class1 class2 class3')
  })

  it('handles objects with boolean values', () => {
    const result = cn({
      'active': true,
      'inactive': false,
      'highlighted': true
    })
    expect(result).toBe('active highlighted')
  })

  it('returns empty string for no arguments', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('handles complex combinations', () => {
    const isActive = true
    const variant = 'primary'
    
    const result = cn(
      'base-button',
      {
        'button-active': isActive,
        'button-inactive': !isActive,
      },
      variant === 'primary' && 'button-primary',
      'px-4 py-2'
    )
    
    expect(result).toBe('base-button button-active button-primary px-4 py-2')
  })
})