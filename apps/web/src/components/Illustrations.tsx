import carSide from '../assets/figma/car-side.svg';
import carTop from '../assets/figma/car-top.svg';
import eyes from '../assets/figma/eye-landmarks.svg';

type IllustrationProps = { className?: string; alt?: string };
export function CarSide({ className = '', alt = 'Side view of a car' }: IllustrationProps) {
  return <img src={carSide} width="360" height="140" alt={alt} className={`illustration ${className}`} />;
}
export function CarTop({ className = '', alt = 'Top view of a car' }: IllustrationProps) {
  return <img src={carTop} width="160" height="300" alt={alt} className={`illustration ${className}`} />;
}
export function EyeLandmarks({ className = '', alt = 'Eye landmarks' }: IllustrationProps) {
  return <img src={eyes} width="300" height="110" alt={alt} className={`illustration ${className}`} />;
}
