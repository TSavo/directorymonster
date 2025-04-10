import * as React from 'react';

interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function Switch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  className = '',
  id
}: SwitchProps) {
  const [isChecked, setIsChecked] = React.useState(checked !== undefined ? checked : defaultChecked);

  React.useEffect(() => {
    if (checked !== undefined) {
      setIsChecked(checked);
    }
  }, [checked]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = event.target.checked;
    if (checked === undefined) {
      setIsChecked(newChecked);
    }
    onCheckedChange?.(newChecked);
  };

  return (
    <label className={`ui-switch-wrapper ${className}`} data-testid="switch">
      <input
        type="checkbox"
        role="switch"
        className="ui-switch-input"
        checked={isChecked}
        onChange={handleChange}
        disabled={disabled}
        id={id}
      />
      <span className="ui-switch-slider"></span>
    </label>
  );
}
