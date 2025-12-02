import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TeeTimeIntervalInputProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

export function TeeTimeIntervalInput({ value, onChange, disabled }: TeeTimeIntervalInputProps) {
  return (
    <div className="w-full md:w-1/3">
      <Label htmlFor="tee-time-interval">Tee Time Interval (minutes)</Label>
      <Input
        id="tee-time-interval"
        type="number"
        min="1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="mt-1"
      />
    </div>
  )
}



