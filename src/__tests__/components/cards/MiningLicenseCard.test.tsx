import { render, screen } from '@testing-library/react';
import MiningLicenseCard from '@/components/cards/MiningLicenseCard';
import { KazakhstanDeposit } from '@/lib/types/listing';

const mockDeposit: KazakhstanDeposit = {
  id: '1',
  title: 'Test Mining License',
  description: 'Test description',
  type: 'MINING_LICENSE',
  mineral: 'Золото',
  region: 'Карагандинская',
  city: 'Караганда',
  area: 100,
  price: 1000000,
  coordinates: [49.8047, 73.1094],
  verified: true,
  featured: false,
  views: 100,
  status: 'ACTIVE',
  images: [],
  documents: [],
  userId: 'user1',
  createdAt: new Date(),
  updatedAt: new Date(),
  licenseSubtype: 'EXTRACTION_RIGHT',
  licenseNumber: 'LIC-123',
  licenseExpiry: new Date('2025-12-31'),
  annualProductionLimit: 1000,
};

describe('MiningLicenseCard', () => {
  it('renders mining license information', () => {
    render(
      <MiningLicenseCard
        deposit={mockDeposit}
        getStatusColor={() => 'bg-blue-100 text-blue-800'}
        getStatusText={() => 'Активно'}
      />
    );

    expect(screen.getByText('Test Mining License')).toBeInTheDocument();
    expect(screen.getByText('Карагандинская')).toBeInTheDocument();
  });

  it('shows type label', () => {
    render(
      <MiningLicenseCard
        deposit={mockDeposit}
        getStatusColor={() => 'bg-blue-100 text-blue-800'}
        getStatusText={() => 'Активно'}
      />
    );

    expect(screen.getByText('Горнодобывающая лицензия')).toBeInTheDocument();
  });

  it('shows verified badge when deposit is verified', () => {
    render(
      <MiningLicenseCard
        deposit={mockDeposit}
        getStatusColor={() => 'bg-blue-100 text-blue-800'}
        getStatusText={() => 'Активно'}
      />
    );

    expect(screen.getByText('Проверено')).toBeInTheDocument();
  });

  it('displays formatted price', () => {
    render(
      <MiningLicenseCard
        deposit={mockDeposit}
        getStatusColor={() => 'bg-blue-100 text-blue-800'}
        getStatusText={() => 'Активно'}
      />
    );

    expect(screen.getByText('1.0 млн ₸')).toBeInTheDocument();
  });

  it('displays status badge', () => {
    render(
      <MiningLicenseCard
        deposit={mockDeposit}
        getStatusColor={() => 'bg-blue-100 text-blue-800'}
        getStatusText={() => 'Активно'}
      />
    );

    expect(screen.getByText('Активно')).toBeInTheDocument();
  });
});
