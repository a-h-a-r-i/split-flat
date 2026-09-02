import React from 'react';
import { 
  ShoppingCart, 
  Zap, 
  Milk, 
  Sprout, 
  Home, 
  Wifi, 
  Car, 
  Film, 
  ShoppingBag, 
  HeartPulse, 
  Receipt,
  Droplets,
  Utensils
} from 'lucide-react';
import { CategoryType } from '../types';

interface CategoryIconProps {
  category: CategoryType | string;
  iconName?: string;
  className?: string;
  isTertiary?: boolean;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ 
  category, 
  iconName, 
  className = "w-5 h-5",
  isTertiary = false 
}) => {
  // If iconName is specified directly or mapped from category
  if (iconName === 'bolt' || category === 'Utility') {
    return <Zap className={className} />;
  }
  if (iconName === 'shopping_cart' || (category === 'Food' && !iconName)) {
    return <ShoppingCart className={className} />;
  }
  if (iconName === 'local_drink' || iconName === 'milk') {
    return <Milk className={className} />;
  }
  if (iconName === 'grass' || iconName === 'vegetables') {
    return <Sprout className={className} />;
  }
  if (iconName === 'wifi') {
    return <Wifi className={className} />;
  }
  if (iconName === 'water_drop') {
    return <Droplets className={className} />;
  }
  if (iconName === 'restaurant') {
    return <Utensils className={className} />;
  }
  if (category === 'Rent') {
    return <Home className={className} />;
  }
  if (category === 'Household') {
    return <Home className={className} />;
  }
  if (category === 'Travel') {
    return <Car className={className} />;
  }
  if (category === 'Entertainment') {
    return <Film className={className} />;
  }
  if (category === 'Shopping') {
    return <ShoppingBag className={className} />;
  }
  if (category === 'Health') {
    return <HeartPulse className={className} />;
  }

  return <Receipt className={className} />;
};
