import React, { useState, useEffect } from 'react';
import { AutoComplete, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

interface SearchAutoCompleteProps<T> {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  dataSource: T[];
  searchFields: (keyof T)[];
  primaryField: keyof T;
  renderOption?: (item: T) => React.ReactNode;
  className?: string;
  allowClear?: boolean;
}

export function SearchAutoComplete<T>({
  placeholder = 'Tìm kiếm...',
  value,
  onChange,
  dataSource,
  searchFields,
  primaryField,
  renderOption,
  className,
  allowClear = true,
}: SearchAutoCompleteProps<T>) {
  const [options, setOptions] = useState<{ value: string; label: React.ReactNode }[]>([]);

  useEffect(() => {
    if (!value) {
      setOptions([]);
      return;
    }

    const searchVal = value.toLowerCase();
    const filtered = dataSource.filter((item) => {
      return searchFields.some((field) => {
        const val = item[field];
        if (typeof val === 'string') {
          return val.toLowerCase().includes(searchVal);
        }
        return false;
      });
    });

    // Limit to 8 suggestions for a cleaner UI
    const suggestions = filtered.slice(0, 8).map((item) => {
      const displayVal = String(item[primaryField]);
      return {
        value: displayVal,
        label: renderOption ? (
          renderOption(item)
        ) : (
          <div className="text-xs py-0.5 text-[var(--text)] font-medium">
            {displayVal}
          </div>
        ),
      };
    });

    setOptions(suggestions);
  }, [value, dataSource, searchFields, primaryField, renderOption]);

  return (
    <AutoComplete
      value={value}
      options={options}
      onChange={onChange}
      onSelect={(val) => onChange(val)}
      className={className}
      popupClassName="search-autocomplete-popup"
      filterOption={false}
    >
      <Input
        placeholder={placeholder}
        prefix={<SearchOutlined className="text-[var(--text-tertiary)]" />}
        allowClear={allowClear}
      />
    </AutoComplete>
  );
}

export default SearchAutoComplete;
