import { useState } from 'react';
import SearchInput from '../SearchInput';

export default function SearchInputExample() {
  const [search, setSearch] = useState('');
  return <SearchInput value={search} onChange={setSearch} />;
}
