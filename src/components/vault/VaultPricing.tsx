'use client';

import React from 'react';

export const PRICING_TIERS = [
  {
    tier: 'Weekday (Mon–Thu)',
    note: 'Best value slots',
    price: '£18pp',
  },
  {
    tier: 'Weekend (Fri–Sun)',
    note: 'Peak times',
    price: '£22pp',
  },
  {
    tier: 'Group of 6',
    note: 'Full room',
    price: '£16pp',
  },
  {
    tier: 'Gift Cards',
    note: 'Any amount, any room',
    price: 'from £18',
  },
];

interface VaultPricingProps {
  onGiftCardClick?: () => void;
}

export const VaultPricing: React.FC<VaultPricingProps> = () => {
  return (
    <section
      id="pricing"
      className="bg-[#100e0c] w-full"
      style={{
        paddingTop: '64px',
        paddingBottom: '64px',
        paddingLeft: 'clamp(24px, 6vw, 96px)',
        paddingRight: 'clamp(24px, 6vw, 96px)',
      }}
    >
      {/* Section Headline */}
      <h2
        className="font-bebas text-[#e8d4b0] tracking-[0.02em] mb-6"
        style={{
          fontSize: 'clamp(28px, 4vw, 60px)',
          letterSpacing: '0.02em',
        }}
      >
        PRICING
      </h2>

      {/* 4 Pricing rows */}
      <div className="flex flex-col">
        {PRICING_TIERS.map((tier) => (
          <div
            key={tier.tier}
            className="flex items-center justify-between border-b border-[#2a2420] py-4 hover:border-[#2ad4b4]/30 transition-colors"
          >
            {/* Tier Name */}
            <div className="font-cormorant italic text-[17px] text-[#e8d4b0] min-w-[140px] sm:min-w-[200px]">
              {tier.tier}
            </div>

            {/* Note */}
            <div className="font-inter text-[14px] text-[#9a8a7a] text-center sm:text-left flex-1 px-4 hidden xs:block sm:block">
              {tier.note}
            </div>

            {/* Price */}
            <div className="font-bebas text-[28px] text-[#2ad4b4] tracking-wide text-right">
              {tier.price}
            </div>
          </div>
        ))}
      </div>

      {/* Note below */}
      <p className="font-cormorant italic text-[14px] text-[#6a5a4a] mt-6">
        Minimum 2 players. Private hire available for groups of 6. Instant digital gift cards.
      </p>
    </section>
  );
};
