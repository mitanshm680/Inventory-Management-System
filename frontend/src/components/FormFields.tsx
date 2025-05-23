import React from 'react';
import { 
  TextField, 
  Checkbox, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  FormHelperText,
  FormControlLabel,
  TextFieldProps,
  SelectProps,
  FormGroup,
  Switch,
  SwitchProps
} from '@mui/material';
import { useField, FieldInputProps, FieldMetaProps, FieldHelperProps } from 'formik';

interface TextInputProps extends Omit<TextFieldProps, 'name'> {
  name: string;
}

export const TextInput: React.FC<TextInputProps> = ({ name, ...props }) => {
  const [field, meta] = useField(name);
  const isError = Boolean(meta.touched && meta.error);
  
  return (
    <TextField
      {...field}
      {...props}
      id={name}
      error={isError}
      helperText={isError ? meta.error : props.helperText}
      fullWidth
    />
  );
};

interface SelectInputProps extends Omit<SelectProps, 'name'> {
  name: string;
  label: string;
  options: Array<{ value: string | number; label: string }>;
}

export const SelectInput: React.FC<SelectInputProps> = ({ 
  name, 
  label, 
  options,
  ...props 
}) => {
  const [field, meta] = useField(name);
  const isError = Boolean(meta.touched && meta.error);
  
  return (
    <FormControl fullWidth error={isError}>
      <InputLabel id={`${name}-label`}>{label}</InputLabel>
      <Select
        {...field}
        {...props}
        labelId={`${name}-label`}
        id={name}
        label={label}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {isError && <FormHelperText>{meta.error}</FormHelperText>}
    </FormControl>
  );
};

interface CheckboxInputProps {
  name: string;
  label: string;
  [key: string]: any;
}

export const CheckboxInput: React.FC<CheckboxInputProps> = ({ 
  name, 
  label, 
  ...props 
}) => {
  const [field, meta, helpers] = useField(name);
  
  return (
    <FormControlLabel
      control={
        <Checkbox
          {...field}
          checked={field.value}
          id={name}
          onChange={(e) => helpers.setValue(e.target.checked)}
          {...props}
        />
      }
      label={label}
    />
  );
};

interface SwitchInputProps extends Omit<SwitchProps, 'name'> {
  name: string;
  label: string;
}

export const SwitchInput: React.FC<SwitchInputProps> = ({ 
  name, 
  label, 
  ...props 
}) => {
  const [field, meta, helpers] = useField(name);
  
  return (
    <FormControlLabel
      control={
        <Switch
          {...field}
          checked={field.value}
          id={name}
          onChange={(e) => helpers.setValue(e.target.checked)}
          {...props}
        />
      }
      label={label}
    />
  );
};

interface DateInputProps extends Omit<TextFieldProps, 'name' | 'type'> {
  name: string;
}

export const DateInput: React.FC<DateInputProps> = ({ 
  name, 
  ...props 
}) => {
  const [field, meta, helpers] = useField(name);
  const isError = Boolean(meta.touched && meta.error);
  
  // Format date for the input field (YYYY-MM-DD)
  const formatDateForInput = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return isNaN(date.getTime()) 
      ? '' 
      : date.toISOString().split('T')[0];
  };
  
  return (
    <TextField
      {...props}
      type="date"
      id={name}
      value={formatDateForInput(field.value)}
      onChange={(e) => {
        helpers.setValue(e.target.value);
      }}
      error={isError}
      helperText={isError ? meta.error : props.helperText}
      InputLabelProps={{ shrink: true }}
      fullWidth
    />
  );
};

interface NumberInputProps extends Omit<TextFieldProps, 'name' | 'type'> {
  name: string;
  min?: number;
  max?: number;
  step?: number;
}

export const NumberInput: React.FC<NumberInputProps> = ({ 
  name, 
  min, 
  max, 
  step = 1,
  ...props 
}) => {
  const [field, meta, helpers] = useField(name);
  const isError = Boolean(meta.touched && meta.error);
  
  return (
    <TextField
      {...props}
      type="number"
      id={name}
      inputProps={{ min, max, step }}
      value={field.value}
      onChange={(e) => {
        const value = e.target.value === '' ? '' : Number(e.target.value);
        helpers.setValue(value);
      }}
      error={isError}
      helperText={isError ? meta.error : props.helperText}
      fullWidth
    />
  );
}; 