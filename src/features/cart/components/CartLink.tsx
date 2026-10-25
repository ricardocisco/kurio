import { Link } from '@tanstack/react-router';
import { ShoppingCartIcon } from 'lucide-react';

import { cn } from '@/shared/lib/cn';

import { useCart } from '../hooks/use-cart';

interface CartLinkProps {
  className?: string;
  iconClassName?: string;
  isCurrent?: boolean;
}

export function CartLink({ className, iconClassName, isCurrent }: CartLinkProps) {
  const { cart } = useCart();
  const count = cart.data?.lines.length ?? 0;
  const label =
    count === 0 ? 'Carrinho vazio' : `Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`;

  return (
    <Link
      to="/cart"
      aria-label={label}
      aria-current={isCurrent ? 'page' : undefined}
      className={cn('relative', className)}
    >
      <ShoppingCartIcon className={cn('size-5', iconClassName)} aria-hidden="true" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.625rem] leading-4 font-bold text-primary-foreground"
        >
          {count}
        </span>
      )}
    </Link>
  );
}
