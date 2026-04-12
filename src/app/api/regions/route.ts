import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countryId = searchParams.get('country_id');

    let backendUrl: string;
    if (countryId) {
      backendUrl = `${API_BASE_URL}/api/v2/locations/countries/${countryId}/regions`;
    } else {
      // List all regions — fetch from all countries
      const countriesRes = await fetch(`${API_BASE_URL}/api/v2/locations/countries`, {
        headers: {
          'Content-Type': 'application/json',
          lang: searchParams.get('language') || 'en',
        },
      });

      if (!countriesRes.ok) {
        return NextResponse.json(
          { message: 'Failed to fetch countries for regions' },
          { status: countriesRes.status },
        );
      }

      const countriesData = await countriesRes.json();
      const countries = countriesData.data || [];

      const allRegions = [];
      for (const country of countries) {
        const regionsRes = await fetch(
          `${API_BASE_URL}/api/v2/locations/countries/${country.id}/regions`,
          {
            headers: {
              'Content-Type': 'application/json',
              lang: searchParams.get('language') || 'en',
            },
          },
        );
        if (regionsRes.ok) {
          const regionsData = await regionsRes.json();
          allRegions.push(...(regionsData.data || []));
        }
      }

      return NextResponse.json({ success: true, data: allRegions });
    }

    const response = await fetch(backendUrl, {
      headers: {
        'Content-Type': 'application/json',
        lang: searchParams.get('language') || 'en',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Failed to fetch regions',
      }));
      return NextResponse.json(
        { message: error.message || 'Failed to fetch regions' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Regions API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
