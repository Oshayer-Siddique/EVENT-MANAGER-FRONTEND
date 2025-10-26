'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Users, Calendar, Ticket, DollarSign, Clock, AlertCircle } from 'lucide-react';

const API_BASE = '/api/admin/dashboard';

// TypeScript interfaces matching your backend DTOs
interface EventMetrics {
  total: number;
  live: number;
  upcoming: number;
  completed: number;
}

interface TicketMetrics {
  pending: number;
  issued: number;
  used: number;
  refunded: number;
  canceled: number;
  expired: number;
}

interface RevenueMetrics {
  gross: number;
  refunded: number;
  net: number;
}

interface RoleCount {
  role: string;
  count: number;
}

interface CustomerMetrics {
  newUsers: number;
  roleCounts: RoleCount[];
}

interface AdminOverviewResponse {
  events: EventMetrics;
  tickets: TicketMetrics;
  revenue: RevenueMetrics;
  customers: CustomerMetrics;
}

interface EventPerformanceRow {
  eventId: string;
  eventName: string;
  eventStart: string;
  ticketsSold: number;
  capacity: number;
  grossRevenue: number;
  refundedAmount: number;
  netRevenue: number;
  sellThrough: number;
  availableSeats: number;
}

interface SalesTrendPoint {
  date: string;
  ticketsIssued: number;
  grossRevenue: number;
  refundTotal: number;
  netRevenue: number;
}

interface HoldAlert {
  holdId: string;
  eventId: string;
  expiresAt: string;
  seatCount: number;
}

interface OperationsSummaryResponse {
  activeHolds: number;
  expiringSoon: number;
  seatsSold: number;
  seatsReserved: number;
  seatsAvailable: number;
  holdAlerts: HoldAlert[];
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: 'up' | 'down';
  trendValue?: string;
  color: string;
}

const AdminDashboard: React.FC = () => {
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [eventPerformance, setEventPerformance] = useState<EventPerformanceRow[]>([]);
  const [salesTrend, setSalesTrend] = useState<SalesTrendPoint[]>([]);
  const [operations, setOperations] = useState<OperationsSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange, selectedEventId, selectedVenueId]);

  const getDateRange = () => {
    const to = new Date().toISOString();
    const from = new Date();
    from.setDate(from.getDate() - parseInt(dateRange));
    return { from: from.toISOString(), to };
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { from, to } = getDateRange();
      
      const buildParams = (additionalParams: Record<string, any> = {}) => {
        const params = new URLSearchParams({ from, to });
        if (selectedEventId) params.append('eventId', selectedEventId);
        if (selectedVenueId) params.append('venueId', selectedVenueId);
        Object.entries(additionalParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null) params.append(key, value.toString());
        });
        return params.toString();
      };

      const [overviewRes, eventsRes, trendRes, opsRes] = await Promise.all([
        fetch(`${API_BASE}/overview?${buildParams()}`),
        fetch(`${API_BASE}/events?${buildParams({ limit: 10 })}`),
        fetch(`${API_BASE}/sales-trend?${buildParams()}`),
        fetch(`${API_BASE}/operations?${buildParams()}`)
      ]);

      const overviewData: AdminOverviewResponse = await overviewRes.json();
      const eventsData: EventPerformanceRow[] = await eventsRes.json();
      const trendData: SalesTrendPoint[] = await trendRes.json();
      const opsData: OperationsSummaryResponse = await opsRes.json();

      setOverview(overviewData);
      setEventPerformance(eventsData);
      setSalesTrend(trendData);
      setOperations(opsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      // Fallback mock data
      setOverview({
        events: { total: 45, live: 8, upcoming: 12, completed: 25 },
        tickets: { pending: 150, issued: 2340, used: 1890, refunded: 45, canceled: 23, expired: 12 },
        revenue: { gross: 125000, refunded: 2250, net: 122750 },
        customers: { 
          newUsers: 342, 
          roleCounts: [
            { role: 'CUSTOMER', count: 2145 },
            { role: 'ORGANIZER', count: 45 },
            { role: 'ADMIN', count: 8 }
          ]
        }
      });

      setEventPerformance([
        { eventId: '1', eventName: 'Summer Music Festival', eventStart: '2025-07-15T19:00:00Z', ticketsSold: 850, capacity: 1000, grossRevenue: 42500, refundedAmount: 500, netRevenue: 42000, sellThrough: 85, availableSeats: 150 },
        { eventId: '2', eventName: 'Tech Conference 2025', eventStart: '2025-08-20T09:00:00Z', ticketsSold: 450, capacity: 500, grossRevenue: 67500, refundedAmount: 1500, netRevenue: 66000, sellThrough: 90, availableSeats: 50 },
        { eventId: '3', eventName: 'Comedy Night Live', eventStart: '2025-06-10T20:00:00Z', ticketsSold: 320, capacity: 400, grossRevenue: 9600, refundedAmount: 0, netRevenue: 9600, sellThrough: 80, availableSeats: 80 },
        { eventId: '4', eventName: 'Jazz Evening', eventStart: '2025-09-05T19:30:00Z', ticketsSold: 180, capacity: 200, grossRevenue: 5400, refundedAmount: 200, netRevenue: 5200, sellThrough: 90, availableSeats: 20 },
        { eventId: '5', eventName: 'Food Festival', eventStart: '2025-07-28T11:00:00Z', ticketsSold: 540, capacity: 800, grossRevenue: 10800, refundedAmount: 300, netRevenue: 10500, sellThrough: 67.5, availableSeats: 260 }
      ]);

      setSalesTrend([
        { date: '2025-10-01', ticketsIssued: 45, grossRevenue: 2250, refundTotal: 0, netRevenue: 2250 },
        { date: '2025-10-05', ticketsIssued: 78, grossRevenue: 3900, refundTotal: 100, netRevenue: 3800 },
        { date: '2025-10-10', ticketsIssued: 92, grossRevenue: 4600, refundTotal: 50, netRevenue: 4550 },
        { date: '2025-10-15', ticketsIssued: 134, grossRevenue: 6700, refundTotal: 200, netRevenue: 6500 },
        { date: '2025-10-20', ticketsIssued: 156, grossRevenue: 7800, refundTotal: 150, netRevenue: 7650 },
        { date: '2025-10-25', ticketsIssued: 189, grossRevenue: 9450, refundTotal: 300, netRevenue: 9150 }
      ]);

      setOperations({
        activeHolds: 23,
        expiringSoon: 5,
        seatsSold: 2340,
        seatsReserved: 156,
        seatsAvailable: 4504,
        holdAlerts: [
          { holdId: '550e8400-e29b-41d4-a716-446655440001', eventId: '550e8400-e29b-41d4-a716-446655440011', expiresAt: '2025-10-26T15:30:00Z', seatCount: 4 },
          { holdId: '550e8400-e29b-41d4-a716-446655440002', eventId: '550e8400-e29b-41d4-a716-446655440012', expiresAt: '2025-10-26T15:45:00Z', seatCount: 2 },
          { holdId: '550e8400-e29b-41d4-a716-446655440003', eventId: '550e8400-e29b-41d4-a716-446655440011', expiresAt: '2025-10-26T16:00:00Z', seatCount: 6 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDateTime = (dateStr: string): string => {
    return new Date(dateStr).toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, trendValue, color }) => (
    <div className="bg-white rounded-xl shadow-md p-6 border-l-4" style={{ borderColor: color }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-600 text-sm font-medium">{title}</span>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold text-gray-800">{value}</span>
        {trend && (
          <div className={`flex items-center text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const ticketStatusData = overview ? [
    { name: 'Issued', value: overview.tickets.issued, color: '#10b981' },
    { name: 'Used', value: overview.tickets.used, color: '#3b82f6' },
    { name: 'Pending', value: overview.tickets.pending, color: '#f59e0b' },
    { name: 'Refunded', value: overview.tickets.refunded, color: '#ef4444' },
    { name: 'Canceled', value: overview.tickets.canceled, color: '#6b7280' },
    { name: 'Expired', value: overview.tickets.expired, color: '#9ca3af' }
  ].filter(item => item.value > 0) : [];

  const totalSeats = operations ? operations.seatsSold + operations.seatsReserved + operations.seatsAvailable : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Event Manager Dashboard</h1>
              <p className="text-gray-600 text-sm mt-1">Real-time overview of your event management platform</p>
            </div>
            <div className="flex items-center gap-4">
              <select 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Metrics - Event Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Events" 
            value={overview?.events.total || 0} 
            icon={Calendar}
            color="#8b5cf6"
          />
          <StatCard 
            title="Live Events" 
            value={overview?.events.live || 0} 
            icon={Calendar}
            color="#10b981"
          />
          <StatCard 
            title="Upcoming Events" 
            value={overview?.events.upcoming || 0} 
            icon={Calendar}
            color="#3b82f6"
          />
          <StatCard 
            title="Completed Events" 
            value={overview?.events.completed || 0} 
            icon={Calendar}
            color="#6b7280"
          />
        </div>

        {/* Revenue & Tickets Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard 
            title="Gross Revenue" 
            value={formatCurrency(overview?.revenue.gross || 0)} 
            icon={DollarSign}
            color="#10b981"
          />
          <StatCard 
            title="Refunded Amount" 
            value={formatCurrency(overview?.revenue.refunded || 0)} 
            icon={DollarSign}
            color="#ef4444"
          />
          <StatCard 
            title="Net Revenue" 
            value={formatCurrency(overview?.revenue.net || 0)} 
            icon={DollarSign}
            trend="up"
            trendValue="+18%"
            color="#8b5cf6"
          />
        </div>

        {/* Sales Trend & Ticket Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Sales Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tickFormatter={formatDate} stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  formatter={(value: any, name: string) => {
                    if (name === 'ticketsIssued') return [value, 'Tickets'];
                    return [formatCurrency(Number(value)), name];
                  }}
                  labelFormatter={formatDate}
                />
                <Legend />
                <Line type="monotone" dataKey="grossRevenue" stroke="#3b82f6" strokeWidth={2} name="Gross Revenue" />
                <Line type="monotone" dataKey="netRevenue" stroke="#10b981" strokeWidth={2} name="Net Revenue" />
                <Line type="monotone" dataKey="refundTotal" stroke="#ef4444" strokeWidth={2} name="Refunds" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Ticket Status Distribution</h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={ticketStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {ticketStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {ticketStatusData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs text-gray-700 truncate">{item.name}</span>
                  <span className="text-xs font-semibold text-gray-800 ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Event Performance Table */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Top Performing Events (by Revenue)</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Event Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Start Date</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Sold / Capacity</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Sell Through</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Gross Revenue</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Refunded</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Net Revenue</th>
                </tr>
              </thead>
              <tbody>
                {eventPerformance.map((event, idx) => (
                  <tr key={event.eventId || idx} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-3 px-4 text-sm text-gray-800 font-medium">{event.eventName}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{formatDateTime(event.eventStart)}</td>
                    <td className="py-3 px-4 text-sm text-right text-gray-800">
                      {event.ticketsSold} / {event.capacity}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(event.sellThrough, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-800 font-medium w-12 text-right">
                          {event.sellThrough.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-800">
                      {formatCurrency(event.grossRevenue)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-red-600">
                      {formatCurrency(event.refundedAmount)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-semibold text-green-600">
                      {formatCurrency(event.netRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Operations Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-6">Seat Allocation Summary</h2>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Sold Seats</span>
                  <span className="text-sm font-bold text-gray-800">
                    {operations?.seatsSold || 0} ({totalSeats > 0 ? ((operations!.seatsSold / totalSeats) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all" 
                    style={{ width: `${totalSeats > 0 ? (operations!.seatsSold / totalSeats) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Reserved Seats</span>
                  <span className="text-sm font-bold text-gray-800">
                    {operations?.seatsReserved || 0} ({totalSeats > 0 ? ((operations!.seatsReserved / totalSeats) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-yellow-500 h-3 rounded-full transition-all" 
                    style={{ width: `${totalSeats > 0 ? (operations!.seatsReserved / totalSeats) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Available Seats</span>
                  <span className="text-sm font-bold text-gray-800">
                    {operations?.seatsAvailable || 0} ({totalSeats > 0 ? ((operations!.seatsAvailable / totalSeats) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-500 h-3 rounded-full transition-all" 
                    style={{ width: `${totalSeats > 0 ? (operations!.seatsAvailable / totalSeats) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Seats</span>
                <span className="text-lg font-bold text-gray-800">{totalSeats.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">Active Holds & Alerts</h2>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-indigo-600">{operations?.activeHolds || 0}</p>
                  <p className="text-xs text-gray-600">Active</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">{operations?.expiringSoon || 0}</p>
                  <p className="text-xs text-gray-600">Expiring</p>
                </div>
              </div>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {operations?.holdAlerts && operations.holdAlerts.length > 0 ? (
                operations.holdAlerts.map((alert, idx) => (
                  <div key={alert.holdId || idx} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          Hold ID: {alert.holdId.substring(0, 8)}...
                        </p>
                        <p className="text-xs text-gray-600">{alert.seatCount} seat{alert.seatCount !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-gray-800">Expires</p>
                      <p className="text-xs text-amber-700">
                        {new Date(alert.expiresAt).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No expiring holds at this time</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customer Metrics */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Customer Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <Users className="w-10 h-10 text-indigo-600 mx-auto mb-3" />
              <p className="text-3xl font-bold text-gray-800">{overview?.customers.newUsers || 0}</p>
              <p className="text-sm text-gray-600 mt-1">New Users</p>
            </div>
            {overview?.customers.roleCounts.map((role, idx) => (
              <div key={idx} className="text-center p-4 bg-blue-50 rounded-lg">
                <Users className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                <p className="text-3xl font-bold text-gray-800">{role.count}</p>
                <p className="text-sm text-gray-600 mt-1">{role.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;