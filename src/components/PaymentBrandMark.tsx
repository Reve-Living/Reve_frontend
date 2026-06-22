import clearpayLogo from '@/assets/clearpay.png';
import gpayLogo from '@/assets/gpay.png';

type PaymentBrand =
  | 'visa'
  | 'mastercard'
  | 'paypal'
  | 'amex'
  | 'google_pay'
  | 'klarna'
  | 'clearpay'
  | 'cod';

interface PaymentBrandMarkProps {
  brand: PaymentBrand;
  compact?: boolean;
  className?: string;
}

const PaymentBrandMark = ({ brand, compact = false, className = '' }: PaymentBrandMarkProps) => {
  const base = compact ? 'h-6 text-xs' : 'h-8 text-sm';
  const common = `inline-flex shrink-0 items-center justify-center whitespace-nowrap ${base} ${className}`;
  const logoClass = compact ? 'max-h-5 w-auto object-contain' : 'max-h-7 w-auto object-contain';

  switch (brand) {
    case 'visa':
      return <span className={`${common} font-extrabold italic tracking-[0.18em] text-[#1434cb]`}>VISA</span>;
    case 'mastercard':
      return (
        <span className={common} aria-label="Mastercard">
          <span className="flex items-center justify-center">
            <span className={`${compact ? 'h-5 w-5' : 'h-6 w-6'} rounded-full bg-[#eb001b]`} />
            <span className={`${compact ? 'h-5 w-5' : 'h-6 w-6'} -ml-2.5 rounded-full bg-[#f79e1b] mix-blend-multiply`} />
          </span>
        </span>
      );
    case 'paypal':
      return <span className={`${common} font-extrabold tracking-tight text-[#003087]`}>Pay<span className="text-[#009cde]">Pal</span></span>;
    case 'amex':
      return <span className={`${common} rounded bg-[#2e77bc] px-2 font-extrabold tracking-[0.08em] text-white`}>AMEX</span>;
    case 'google_pay':
      return (
        <span className={common}>
          <img src={gpayLogo} alt="Google Pay" className={logoClass} />
        </span>
      );
    case 'klarna':
      return <span className={`${common} rounded bg-[#ffb3c7] px-2 font-extrabold text-[#17120f]`}>Klarna.</span>;
    case 'clearpay':
      return (
        <span className={common}>
          <img src={clearpayLogo} alt="Clearpay" className={logoClass} />
        </span>
      );
    case 'cod':
      return <span className={`${common} font-semibold text-slate-700`}>COD</span>;
    default:
      return null;
  }
};

export default PaymentBrandMark;
