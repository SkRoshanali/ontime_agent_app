import { NextRequest } from 'next/server';
import { db } from '@/db/client';
import { batches, orders, order_items, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { errorResponse } from '@/lib/utils';
import { sortByDistance, haversineKm } from '@/lib/route-sort';
import {
  quantityToMilliunits,
  priceToPaise,
  calculateLineTotal,
  paiseToPrice,
} from '@/lib/money';
import ExcelJS from 'exceljs';

interface OrderWithUser {
  id: string;
  order_no: number;
  status: string;
  total: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  pincode: string;
  lat?: string | null;
  lng?: string | null;
  delivery_phone: string;
  placed_at: string | Date;
  packed_at?: string | null;
  user_name: string;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || (userRole !== 'agent' && userRole !== 'admin')) {
      return errorResponse('Unauthorized', 401);
    }

    const { id: batchId } = await params;
    const url = new URL(request.url);
    const agentLatStr = url.searchParams.get('lat');
    const agentLngStr = url.searchParams.get('lng');

    // Get batch
    const batchResult = await db
      .select()
      .from(batches)
      .where(eq(batches.id, Number(batchId)));

    if (batchResult.length === 0) {
      return errorResponse('Batch not found', 404);
    }

    const batch = batchResult[0];

    // Verify agent owns batch (or is admin)
    if (userRole === 'agent' && batch.agent_id !== userId) {
      return errorResponse('Forbidden', 403);
    }

    // Get all orders in batch with customer info
    const batchOrders = (await db
      .select({
        id: orders.id,
        order_no: orders.order_no,
        status: orders.status,
        total: orders.total,
        address_line1: orders.address_line1,
        address_line2: orders.address_line2,
        city: orders.city,
        pincode: orders.pincode,
        lat: orders.lat,
        lng: orders.lng,
        delivery_phone: orders.delivery_phone,
        placed_at: orders.placed_at,
        packed_at: orders.packed_at,
        user_id: orders.user_id,
        user_name: users.name,
      })
      .from(orders)
      .leftJoin(users, eq(orders.user_id, users.id))
      .where(eq(orders.batch_id, Number(batchId)))) as unknown as OrderWithUser[];

    // Sort orders
    let sortedOrders = batchOrders;
    if (agentLatStr && agentLngStr) {
      const agentLat = parseFloat(agentLatStr);
      const agentLng = parseFloat(agentLngStr);
      if (!isNaN(agentLat) && !isNaN(agentLng)) {
        sortedOrders = sortByDistance(batchOrders, agentLat, agentLng) as OrderWithUser[];
      }
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Batch Deliveries');

    // Set column widths
    worksheet.columns = [
      { header: 'Stop #', key: 'stop', width: 8 },
      { header: 'Order #', key: 'order_no', width: 10 },
      { header: 'Customer', key: 'customer', width: 20 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Address', key: 'address', width: 40 },
      { header: 'Latitude', key: 'lat', width: 15 },
      { header: 'Longitude', key: 'lng', width: 15 },
      { header: 'Maps Link', key: 'maps', width: 40 },
      { header: 'Distance (km)', key: 'distance', width: 12 },
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4CAF50' },
    };

    let currentRow = 2;
    let stopNumber = 1;

    // Add data for each order
    for (const order of sortedOrders) {
      // Get items for this order
      const itemsForOrder = await db
        .select()
        .from(order_items)
        .where(eq(order_items.order_id, order.id));

      // Calculate distance
      let distance: number | null = null;
      let mapsLink = '';
      let latStr = 'No coordinates';
      let lngStr = 'No coordinates';

      if (order.lat && order.lng && agentLatStr && agentLngStr) {
        const agentLat = parseFloat(agentLatStr);
        const agentLng = parseFloat(agentLngStr);
        if (!isNaN(agentLat) && !isNaN(agentLng)) {
          const orderLat = typeof order.lat === 'string' ? parseFloat(order.lat) : (order.lat as number);
          const orderLng = typeof order.lng === 'string' ? parseFloat(order.lng) : (order.lng as number);
          if (!isNaN(orderLat) && !isNaN(orderLng)) {
            distance = haversineKm(agentLat, agentLng, orderLat, orderLng);
            latStr = orderLat.toString();
            lngStr = orderLng.toString();
            mapsLink = `https://www.google.com/maps?q=${orderLat},${orderLng}`;
          }
        }
      } else if (order.lat && order.lng) {
        latStr = typeof order.lat === 'string' ? order.lat : (order.lat as number).toString();
        lngStr = typeof order.lng === 'string' ? order.lng : (order.lng as number).toString();
        mapsLink = `https://www.google.com/maps?q=${latStr},${lngStr}`;
      }

      // Add header row for this order
      const headerRowNum = currentRow;
      worksheet.getRow(headerRowNum).values = {
        stop: stopNumber++,
        order_no: order.order_no,
        customer: order.user_name,
        phone: order.delivery_phone,
        address: `${order.address_line1}${order.address_line2 ? ', ' + order.address_line2 : ''} ${order.city}, ${order.pincode}`,
        lat: latStr,
        lng: lngStr,
        maps: mapsLink,
        distance: distance ? distance.toFixed(1) : '',
      };

      // Style header row
      const styledHeaderRow = worksheet.getRow(headerRowNum);
      styledHeaderRow.font = { bold: true };
      styledHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE8F5E9' },
      };
      currentRow++;

      // Add item rows
      for (const item of itemsForOrder) {
        const qtyMilli = quantityToMilliunits(item.quantity);
        const pricePaise = priceToPaise(item.price_snapshot);
        const lineTotalPaise = calculateLineTotal(qtyMilli, pricePaise);

        const itemRow = worksheet.getRow(currentRow);
        itemRow.values = {
          order_no: '',
          customer: item.name_snapshot,
          phone: `${item.quantity} × ${item.unit_snapshot}`,
          address: `${paiseToPrice(pricePaise).replace('₹', '')}`,
          lat: paiseToPrice(lineTotalPaise).replace('₹', ''),
        };

        if (item.unavailable) {
          itemRow.font = { strike: true };
          itemRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFEBEE' },
          };
          itemRow.getCell('lng').value = 'UNAVAILABLE';
        }

        currentRow++;
      }

      // Add total row
      const availableItems = itemsForOrder.filter((i) => !i.unavailable);
      const collectAmount = availableItems.reduce((total, item) => {
        const qtyMilli = quantityToMilliunits(item.quantity);
        const pricePaise = priceToPaise(item.price_snapshot);
        return total + calculateLineTotal(qtyMilli, pricePaise);
      }, 0);

      const totalRow = worksheet.getRow(currentRow);
      totalRow.values = {
        customer: 'Collect Amount:',
        address: paiseToPrice(collectAmount).replace('₹', ''),
      };
      totalRow.font = { bold: true };
      totalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFCE4EC' },
      };
      currentRow++;

      // Add blank row between customers
      currentRow++;
    }

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();

    // Create response
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `batch-${batchId}-${timestamp}.xlsx`;

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export batch error:', error);
    return errorResponse('Internal server error', 500);
  }
}
