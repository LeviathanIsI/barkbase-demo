/**
 * Seed Data Loader
 *
 * Loads all seed data JSON files and resolves relative dates.
 * Dates in seed data use format: { "$daysFromNow": -3, "$hour": 10 }
 */

import ownersData from './owners.json';
import petsData from './pets.json';
import petOwnersData from './petOwners.json';
import staffData from './staff.json';
import kennelsData from './kennels.json';
import servicesData from './services.json';
import bookingsData from './bookings.json';
import bookingPetsData from './bookingPets.json';
import vaccinationsData from './vaccinations.json';
import incidentsData from './incidents.json';
import invoicesData from './invoices.json';
import invoiceLinesData from './invoiceLines.json';
import paymentsData from './payments.json';
import packagesData from './packages.json';
import tasksData from './tasks.json';
import workflowsData from './workflows.json';
import segmentsData from './segments.json';
import messagesData from './messages.json';
import runsData from './runs.json';
import runTemplatesData from './runTemplates.json';
import runAssignmentsData from './runAssignments.json';
import tenantData from './tenant.json';

/**
 * Resolve relative date references to actual ISO date strings
 *
 * @param {any} data - Data to process (can be object, array, or primitive)
 * @param {Date} now - Reference date (defaults to current time)
 * @returns {any} - Data with resolved dates
 */
export const resolveDates = (data, now = new Date()) => {
  if (data === null || data === undefined) return data;

  // Handle date offset objects
  if (typeof data === 'object' && !Array.isArray(data)) {
    // Check for $daysFromNow format
    if (data.$daysFromNow !== undefined) {
      const result = new Date(now);
      result.setDate(result.getDate() + data.$daysFromNow);

      // Set specific hour if provided
      if (data.$hour !== undefined) {
        result.setHours(data.$hour, 0, 0, 0);
      }

      // Set specific minute if provided
      if (data.$minute !== undefined) {
        result.setMinutes(data.$minute);
      }

      return result.toISOString();
    }

    // Check for $hoursFromNow format
    if (data.$hoursFromNow !== undefined) {
      const result = new Date(now);
      result.setHours(result.getHours() + data.$hoursFromNow);
      return result.toISOString();
    }

    // Check for $dateOnly format (returns YYYY-MM-DD)
    if (data.$dateOnly !== undefined && data.$daysFromNow !== undefined) {
      const result = new Date(now);
      result.setDate(result.getDate() + data.$daysFromNow);
      return result.toISOString().split('T')[0];
    }

    // Recursively process object properties
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, resolveDates(value, now)])
    );
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => resolveDates(item, now));
  }

  // Return primitives as-is
  return data;
};

/**
 * Load and process all seed data
 *
 * @returns {Object} All seed data collections with resolved dates
 */
export const loadSeedData = () => {
  const now = new Date();

  return {
    owners: resolveDates(ownersData, now),
    pets: resolveDates(petsData, now),
    petOwners: resolveDates(petOwnersData, now),
    staff: resolveDates(staffData, now),
    kennels: resolveDates(kennelsData, now),
    services: resolveDates(servicesData, now),
    bookings: resolveDates(bookingsData, now),
    bookingPets: resolveDates(bookingPetsData, now),
    vaccinations: resolveDates(vaccinationsData, now),
    incidents: resolveDates(incidentsData, now),
    invoices: resolveDates(invoicesData, now),
    invoiceLines: resolveDates(invoiceLinesData, now),
    payments: resolveDates(paymentsData, now),
    packages: resolveDates(packagesData, now),
    tasks: resolveDates(tasksData, now),
    workflows: resolveDates(workflowsData, now),
    segments: resolveDates(segmentsData, now),
    messages: resolveDates(messagesData, now),
    runs: resolveDates(runsData, now),
    runTemplates: resolveDates(runTemplatesData, now),
    runAssignments: resolveDates(runAssignmentsData, now),
    tenant: resolveDates(tenantData, now),
  };
};

export default loadSeedData;
