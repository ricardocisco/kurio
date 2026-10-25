import { useNavigate } from '@tanstack/react-router';
import { SearchIcon } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';

import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';

export function HeaderSearch() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [term, setTerm] = useState('');
  const inputId = useId();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const search = term.trim();
    setIsOpen(false);
    void navigate({
      to: '/marketplace',
      search: (previous) => ({ ...previous, q: search || undefined, page: undefined }),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-foreground" aria-label="Buscar NFTs">
          <SearchIcon className="size-5" aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent className="top-24 translate-y-0 sm:max-w-xl">
        <DialogHeader className="text-left">
          <DialogTitle>Buscar NFTs</DialogTitle>
          <DialogDescription>Pesquise por nome, coleção ou ID do token.</DialogDescription>
        </DialogHeader>
        <form role="search" onSubmit={handleSubmit} className="flex gap-2">
          <label htmlFor={inputId} className="sr-only">
            Termo de busca
          </label>
          <Input
            id={inputId}
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Ex.: Emerald Ape"
            maxLength={80}
            autoComplete="off"
          />
          <Button type="submit">Buscar</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
