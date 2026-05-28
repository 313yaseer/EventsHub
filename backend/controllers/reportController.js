const { query } = require('../config/db');

function toNumber(value) {
  return Number(value || 0);
}

function toInt(value) {
  return Number.parseInt(value || 0, 10);
}

function toPercent(numerator, denominator) {
  if (!denominator) {
    return 0;
  }

  return Number(((numerator / denominator) * 100).toFixed(2));
}

function buildDateRangeFilters(column, params, values, startIndex) {
  const conditions = [];
  let index = startIndex;

  if (params.from) {
    conditions.push(`${column} >= $${index}`);
    values.push(params.from);
    index += 1;
  }

  if (params.to) {
    conditions.push(`${column} <= $${index}`);
    values.push(params.to);
    index += 1;
  }

  return { conditions, index };
}

async function getDashboardStats(req, res, next) {
  try {
    const tenantId = req.tenantId;

    const [
      bookingsThisMonthResult,
      pendingBookingsResult,
      upcomingEventsResult,
      todaysEventsResult,
      recentBookingsResult,
      monthlyRevenueResult,
    ] = await Promise.all([
      query(
        `SELECT COUNT(*)::int AS count,
                COALESCE(SUM(amount_due), 0)::numeric AS amount_due,
                COALESCE(SUM(amount_paid), 0)::numeric AS amount_paid
         FROM bookings
         WHERE tenant_id = $1
           AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())`,
        [tenantId]
      ),
      query(
        `SELECT COUNT(*)::int AS count
         FROM bookings
         WHERE tenant_id = $1
           AND status = 'pending'`,
        [tenantId]
      ),
      query(
        `SELECT COUNT(*)::int AS count
         FROM events
         WHERE tenant_id = $1
           AND status = 'upcoming'
           AND event_date >= CURRENT_DATE`,
        [tenantId]
      ),
      query(
        `SELECT e.*, b.event_name, b.event_name AS name, b.event_type,
                b.guest_count, h.name AS hall_name, c.full_name AS client_name,
                COALESCE(e.total_attendees, 0)::int AS attendee_count
         FROM events e
         JOIN bookings b ON e.booking_id = b.id
         LEFT JOIN halls h ON b.hall_id = h.id
         LEFT JOIN clients c ON b.client_id = c.id
         WHERE e.tenant_id = $1
           AND e.event_date = CURRENT_DATE
         ORDER BY e.start_time`,
        [tenantId]
      ),
      query(
        `SELECT b.*, c.full_name AS client_name, h.name AS hall_name
         FROM bookings b
         LEFT JOIN clients c ON b.client_id = c.id
         LEFT JOIN halls h ON b.hall_id = h.id
         WHERE b.tenant_id = $1
         ORDER BY b.created_at DESC
         LIMIT 5`,
        [tenantId]
      ),
      query(
        `SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month,
                DATE_TRUNC('month', created_at) AS month_date,
                COALESCE(SUM(amount_paid), 0)::numeric AS collected,
                COALESCE(SUM(amount_due - amount_paid), 0)::numeric AS outstanding
         FROM bookings
         WHERE tenant_id = $1
           AND created_at >= NOW() - INTERVAL '6 months'
         GROUP BY DATE_TRUNC('month', created_at)
         ORDER BY month_date ASC`,
        [tenantId]
      ),
    ]);

    const bookingsThisMonth = bookingsThisMonthResult.rows[0];

    return res.status(200).json({
      success: true,
      stats: {
        bookings_this_month: toInt(bookingsThisMonth.count),
        revenue_this_month: toNumber(bookingsThisMonth.amount_paid),
        outstanding_this_month: toNumber(bookingsThisMonth.amount_due) -
          toNumber(bookingsThisMonth.amount_paid),
        pending_bookings: toInt(pendingBookingsResult.rows[0].count),
        upcoming_events: toInt(upcomingEventsResult.rows[0].count),
        events_today: todaysEventsResult.rows.length,
        todays_events: todaysEventsResult.rows,
        recent_bookings: recentBookingsResult.rows,
        monthly_revenue: monthlyRevenueResult.rows.map((row) => ({
          month: row.month,
          month_date: row.month_date,
          collected: toNumber(row.collected),
          outstanding: toNumber(row.outstanding),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getBookingReport(req, res, next) {
  try {
    const conditions = ['b.tenant_id = $1'];
    const values = [req.tenantId];
    let index = 2;

    const dateFilters = buildDateRangeFilters(
      'b.preferred_date',
      req.query,
      values,
      index
    );
    conditions.push(...dateFilters.conditions);
    index = dateFilters.index;

    if (req.query.status) {
      conditions.push(`b.status = $${index}`);
      values.push(req.query.status);
      index += 1;
    }

    if (req.query.event_type) {
      conditions.push(`b.event_type = $${index}`);
      values.push(req.query.event_type);
      index += 1;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const bookingsResult = await query(
      `SELECT b.*, c.full_name AS client_name, h.name AS hall_name
       FROM bookings b
       LEFT JOIN clients c ON b.client_id = c.id
       LEFT JOIN halls h ON b.hall_id = h.id
       ${whereClause}
       ORDER BY b.preferred_date DESC, b.created_at DESC`,
      values
    );

    const bookings = bookingsResult.rows;

    const summary = bookings.reduce(
      (acc, booking) => {
        acc.total += 1;
        acc.by_status[booking.status] = (acc.by_status[booking.status] || 0) + 1;
        acc.by_type[booking.event_type] =
          (acc.by_type[booking.event_type] || 0) + 1;
        acc.total_revenue += toNumber(booking.amount_paid);
        acc.outstanding +=
          toNumber(booking.amount_due) - toNumber(booking.amount_paid);
        return acc;
      },
      {
        total: 0,
        by_status: {},
        by_type: {},
        total_revenue: 0,
        outstanding: 0,
      }
    );

    return res.status(200).json({
      success: true,
      summary,
      bookings,
    });
  } catch (error) {
    next(error);
  }
}

async function getEventReport(req, res, next) {
  try {
    const conditions = ['e.tenant_id = $1'];
    const values = [req.tenantId];
    let index = 2;

    const dateFilters = buildDateRangeFilters(
      'e.event_date',
      req.query,
      values,
      index
    );
    conditions.push(...dateFilters.conditions);
    index = dateFilters.index;

    if (req.query.status) {
      conditions.push(`e.status = $${index}`);
      values.push(req.query.status);
      index += 1;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const eventsResult = await query(
      `SELECT e.*, b.event_name, b.event_type, b.guest_count,
              h.name AS hall_name,
              COALESCE(e.total_attendees, 0)::int AS total_attendees,
              COALESCE(e.check_in_count, 0)::int AS check_in_count
       FROM events e
       JOIN bookings b ON e.booking_id = b.id
       LEFT JOIN halls h ON b.hall_id = h.id
       ${whereClause}
       ORDER BY e.event_date DESC, e.start_time DESC`,
      values
    );

    const events = eventsResult.rows.map((event) => ({
      ...event,
      not_checked_in_count:
        toInt(event.total_attendees) - toInt(event.check_in_count),
      check_in_rate: toPercent(
        toInt(event.check_in_count),
        toInt(event.total_attendees)
      ),
    }));

    const summary = events.reduce(
      (acc, event) => {
        acc.total += 1;
        acc.by_status[event.status] = (acc.by_status[event.status] || 0) + 1;
        return acc;
      },
      {
        total: 0,
        by_status: {},
      }
    );

    return res.status(200).json({
      success: true,
      summary,
      events,
    });
  } catch (error) {
    next(error);
  }
}

async function getAttendeeReport(req, res, next) {
  try {
    const conditions = ['a.tenant_id = $1'];
    const values = [req.tenantId];
    let index = 2;

    if (req.query.event_id) {
      conditions.push(`a.event_id = $${index}`);
      values.push(req.query.event_id);
      index += 1;
    }

    const dateFilters = buildDateRangeFilters(
      'e.event_date',
      req.query,
      values,
      index
    );
    conditions.push(...dateFilters.conditions);
    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const attendeesResult = await query(
      `SELECT a.*, b.event_name, e.event_date, e.start_time
       FROM attendees a
       JOIN events e ON a.event_id = e.id
       JOIN bookings b ON e.booking_id = b.id
       ${whereClause}
       ORDER BY e.event_date DESC, e.start_time DESC, a.full_name ASC`,
      values
    );

    const attendees = attendeesResult.rows;
    const totalRegistered = attendees.length;
    const totalCheckedIn = attendees.filter((attendee) => attendee.checked_in).length;

    return res.status(200).json({
      success: true,
      summary: {
        total_registered: totalRegistered,
        total_checked_in: totalCheckedIn,
        check_in_rate: toPercent(totalCheckedIn, totalRegistered),
      },
      attendees,
    });
  } catch (error) {
    next(error);
  }
}

async function getRevenueReport(req, res, next) {
  try {
    const conditions = ['b.tenant_id = $1'];
    const values = [req.tenantId];

    const dateFilters = buildDateRangeFilters(
      'b.created_at::date',
      req.query,
      values,
      2
    );
    conditions.push(...dateFilters.conditions);

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const [summaryResult, monthlyBreakdownResult, byEventTypeResult] =
      await Promise.all([
        query(
          `SELECT COALESCE(SUM(b.amount_paid), 0)::numeric AS total_collected,
                  COALESCE(SUM(b.amount_due - b.amount_paid), 0)::numeric AS total_outstanding,
                  COALESCE(SUM(b.amount_due), 0)::numeric AS total_value
           FROM bookings b
           ${whereClause}`,
          values
        ),
        query(
          `SELECT TO_CHAR(DATE_TRUNC('month', b.created_at), 'Mon YYYY') AS month,
                  DATE_TRUNC('month', b.created_at) AS month_date,
                  COALESCE(SUM(b.amount_paid), 0)::numeric AS collected,
                  COALESCE(SUM(b.amount_due - b.amount_paid), 0)::numeric AS outstanding
           FROM bookings b
           ${whereClause}
           GROUP BY DATE_TRUNC('month', b.created_at)
           ORDER BY month_date ASC`,
          values
        ),
        query(
          `SELECT b.event_type AS type,
                  COALESCE(SUM(b.amount_due), 0)::numeric AS total,
                  COALESCE(SUM(b.amount_paid), 0)::numeric AS collected
           FROM bookings b
           ${whereClause}
           GROUP BY b.event_type
           ORDER BY total DESC, type ASC`,
          values
        ),
      ]);

    const summaryRow = summaryResult.rows[0];

    return res.status(200).json({
      success: true,
      summary: {
        total_collected: toNumber(summaryRow.total_collected),
        total_outstanding: toNumber(summaryRow.total_outstanding),
        total_value: toNumber(summaryRow.total_value),
      },
      monthly_breakdown: monthlyBreakdownResult.rows.map((row) => ({
        month: row.month,
        collected: toNumber(row.collected),
        outstanding: toNumber(row.outstanding),
      })),
      by_event_type: byEventTypeResult.rows.map((row) => ({
        type: row.type,
        total: toNumber(row.total),
        collected: toNumber(row.collected),
      })),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardStats,
  getBookingReport,
  getEventReport,
  getAttendeeReport,
  getRevenueReport,
};
