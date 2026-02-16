#!/usr/bin/env python3
"""
Convert Vendor_bills_10_feb.xlsx into localStorage-compatible JSON
for the SafeStorage Accounts React app.

Outputs: public/seed-data.json (loaded by seed.html)
"""

import pandas as pd
import json
import re
import math
import uuid
from datetime import datetime

EXCEL_FILE = '../Vendor_bills_10_feb.xlsx'
OUTPUT_FILE = 'public/seed-data.json'


def gen_id():
    """Generate unique ID matching the app's format."""
    return f"{int(datetime.now().timestamp() * 1000)}-{uuid.uuid4().hex[:9]}"


def clean(val):
    if val is None:
        return None
    if isinstance(val, float) and math.isnan(val):
        return None
    if isinstance(val, pd.Timestamp):
        return val.strftime('%Y-%m-%d')
    if isinstance(val, datetime):
        return val.strftime('%Y-%m-%d')
    return val


def to_float(val):
    if val is None:
        return 0
    if isinstance(val, float) and math.isnan(val):
        return 0
    if isinstance(val, (int, float)):
        return float(val)
    try:
        return float(str(val).replace(',', '').replace(' ', '').strip())
    except (ValueError, TypeError):
        return 0


def normalize_date(val):
    """Try to parse various date formats into YYYY-MM-DD."""
    if val is None:
        return ''
    if isinstance(val, pd.Timestamp):
        return val.strftime('%Y-%m-%d')
    if isinstance(val, datetime):
        return val.strftime('%Y-%m-%d')
    s = str(val).strip()
    if not s or s.lower() == 'nan':
        return ''
    # Try common formats
    for fmt in [
        '%Y-%m-%d', '%d-%m-%Y', '%d/%m/%Y', '%d-%m-%y',
        '%Y-%m-%d %H:%M:%S', '%d%m%Y', '%d.%m.%Y',
        '%d-%m-%Y %H:%M:%S', '%m/%d/%Y',
    ]:
        try:
            return datetime.strptime(s, fmt).strftime('%Y-%m-%d')
        except ValueError:
            continue
    return s


def is_paid(status_val):
    """Check if a payment status indicates 'paid/done'."""
    if not status_val:
        return False
    s = str(status_val).lower().strip()
    return 'payment done' in s or 'paid' in s or 'processed' in s


def make_entry(data, paid=False):
    """Add standard fields expected by the React app."""
    now = datetime.now().isoformat()
    entry = {
        'id': gen_id(),
        'status': 'closed' if paid else 'pending',
        'managerApproval': 'approved' if paid else 'pending',
        'accountsApproval': 'approved' if paid else 'pending',
        'submittedBy': 'system',
        'submittedAt': now,
        'createdAt': now,
        'updatedAt': now,
    }
    if paid:
        entry['paymentCompletedDate'] = now
        entry['paymentCompletedBy'] = 'system'
        entry['managerApprovalDate'] = now
        entry['managerApprovedBy'] = 'system'
        entry['accountsApprovalDate'] = now
        entry['accountsApprovedBy'] = 'system'
    entry.update(data)
    return entry


# ============ CONVERTERS ============

def convert_general_bills(xl):
    df = pd.read_excel(xl, sheet_name='General bills ')
    records = []
    for _, row in df.iterrows():
        vendor = clean(row.iloc[1])
        if not vendor or str(vendor).strip().lower() in ['nan', 'none', '']:
            continue
        vendor_str = str(vendor).strip()

        payment_status_raw = clean(row.iloc[7])
        payment_status = str(payment_status_raw).strip() if payment_status_raw else 'Pending'
        if payment_status.lower() in ['nan', 'none', '']:
            payment_status = 'Pending'

        paid = is_paid(payment_status)

        records.append(make_entry({
            'vendorName': vendor_str,
            'invoiceNo': str(clean(row.iloc[2]) or ''),
            'invoiceDate': normalize_date(clean(row.iloc[3])),
            'month': str(clean(row.iloc[4]) or ''),
            'payableAmount': to_float(row.iloc[5]),
            'paymentStatus': payment_status if paid else 'Pending',
        }, paid=paid))
    return records


def convert_transport_bills(xl):
    df = pd.read_excel(xl, sheet_name='Transport bills ')
    records = []
    for _, row in df.iterrows():
        vendor = clean(row.iloc[1])
        if not vendor or str(vendor).strip().lower() in ['nan', 'none', '']:
            continue
        vendor_str = str(vendor).strip()

        amount_raw = clean(row.iloc[5])
        invoice_amount = to_float(amount_raw)

        payment_raw = clean(row.iloc[9])
        paid = is_paid(payment_raw)

        city = clean(row.iloc[8])
        city_str = str(city).strip() if city and str(city).lower() not in ['nan', 'none'] else ''

        records.append(make_entry({
            'invoiceNumber': str(clean(row.iloc[2]) or ''),
            'vendorName': vendor_str,
            'city': city_str,
            'invoiceDate': normalize_date(clean(row.iloc[3])),
            'packingMaterial': 0,
            'receivedAmount': 0,
            'invoiceAmount': invoice_amount,
            'profitLoss': 0,
            'remarks': '',
        }, paid=paid))
    return records


def convert_packing_materials(xl):
    df = pd.read_excel(xl, sheet_name='Packing materials bills')
    records = []
    for _, row in df.iterrows():
        vendor = clean(row.iloc[3])
        if not vendor or str(vendor).strip().lower() in ['nan', 'none', '']:
            continue

        payment_raw = clean(row.iloc[10])
        paid = is_paid(payment_raw)

        city = clean(row.iloc[9])
        city_str = str(city).strip() if city and str(city).lower() not in ['nan', 'none'] else ''

        records.append(make_entry({
            'vendorName': str(vendor).strip(),
            'invoiceNo': str(clean(row.iloc[4]) or ''),
            'invoiceDate': normalize_date(clean(row.iloc[1])),
            'payableAmount': to_float(row.iloc[5]),
            'paymentStatus': 'Payment done' if paid else 'Pending',
            'city': city_str,
        }, paid=paid))
    return records


def convert_petty_cash(xl):
    df = pd.read_excel(xl, sheet_name='All types of petty cash bills ')
    records = []
    for _, row in df.iterrows():
        name = clean(row.iloc[1])
        if not name or str(name).strip().lower() in ['nan', 'none', '']:
            continue

        desc = clean(row.iloc[2])
        category = clean(row.iloc[3])
        payment_raw = clean(row.iloc[7])
        paid = is_paid(payment_raw)

        records.append(make_entry({
            'category': str(category).strip() if category and str(category).lower() not in ['nan', 'none'] else 'Petty Cash',
            'particulars': str(name).strip() + (' - ' + str(desc).strip() if desc and str(desc).lower() not in ['nan', 'none'] else ''),
            'date': '',
            'amount': to_float(row.iloc[5]),
            'remarks': str(clean(row.iloc[6]) or ''),
        }, paid=paid))
    return records


def convert_damage_refunds(xl):
    df = pd.read_excel(xl, sheet_name='Damage Refunds')
    records = []
    for _, row in df.iterrows():
        customer = clean(row.iloc[2])
        if not customer or str(customer).strip().lower() in ['nan', 'none', '']:
            continue

        desc = clean(row.iloc[4])
        status_raw = clean(row.iloc[5])
        paid = is_paid(status_raw)

        records.append(make_entry({
            'customerId': str(customer).strip(),
            'customerName': str(customer).strip(),
            'refundAmount': to_float(row.iloc[3]),
            'reason': str(desc).strip() if desc and str(desc).lower() not in ['nan', 'none'] else 'Refund',
            'date': normalize_date(clean(row.iloc[1])),
            'remarks': '',
        }, paid=paid))
    return records


def convert_happay_card(xl):
    df = pd.read_excel(xl, sheet_name='Happay card')
    records = []
    for _, row in df.iterrows():
        payment_raw = clean(row.iloc[4])
        paid = is_paid(payment_raw)

        records.append(make_entry({
            'vendorName': 'Happay Card',
            'month': str(clean(row.iloc[1]) or ''),
            'payableAmount': to_float(row.iloc[2]),
            'date': normalize_date(clean(row.iloc[6])),
            'remarks': str(clean(row.iloc[3]) or ''),
        }, paid=paid))
    return records


def convert_drive_track_porter(xl):
    df = pd.read_excel(xl, sheet_name='Drive track and porter')
    records = []
    for _, row in df.iterrows():
        particular = clean(row.iloc[0])
        if not particular or str(particular).strip().lower() in ['nan', 'none', '']:
            continue

        payment_raw = clean(row.iloc[4])
        paid = is_paid(payment_raw)
        mode = clean(row.iloc[5])
        mode_str = str(mode).strip() if mode and str(mode).lower() not in ['nan', 'none'] else ''

        # Map payment modes
        if 'credit' in mode_str.lower():
            mode_str = 'Bank Transfer'
        elif 'idfc' in mode_str.lower():
            mode_str = 'Bank Transfer'

        records.append(make_entry({
            'driverName': str(particular).strip(),
            'date': normalize_date(clean(row.iloc[3])),
            'distance': '',
            'amount': to_float(row.iloc[2]),
            'paymentMode': mode_str,
            'remarks': f"Month: {clean(row.iloc[1]) or ''}",
        }, paid=paid))
    return records


def convert_reviews(xl):
    df = pd.read_excel(xl, sheet_name='Reviews')
    records = []
    for _, row in df.iterrows():
        name = clean(row.iloc[1])
        if not name or str(name).strip().lower() in ['nan', 'none', '']:
            continue

        review_count = to_float(row.iloc[2])
        city = clean(row.iloc[3])

        records.append(make_entry({
            'city': str(city).strip() if city and str(city).lower() not in ['nan', 'none'] else '',
            'rating': min(int(review_count), 5) if review_count > 0 else 0,
            'amount': to_float(row.iloc[4]),
            'date': normalize_date(clean(row.iloc[0])),
            'remarks': f"{name} - {int(review_count)} reviews",
            'reviewerName': str(name).strip(),
            'reviewCount': int(review_count),
        }, paid=True))
    return records


def main():
    print("Reading Excel file...")
    xl = pd.ExcelFile(EXCEL_FILE)

    print("Converting General Bills...")
    general = convert_general_bills(xl)
    print(f"  -> {len(general)} records")

    print("Converting Transport Bills...")
    transport = convert_transport_bills(xl)
    print(f"  -> {len(transport)} records")

    print("Converting Packing Materials...")
    packing = convert_packing_materials(xl)
    print(f"  -> {len(packing)} records")

    print("Converting Petty Cash...")
    petty = convert_petty_cash(xl)
    print(f"  -> {len(petty)} records")

    print("Converting Damage Refunds...")
    refunds = convert_damage_refunds(xl)
    print(f"  -> {len(refunds)} records")

    print("Converting Happay Card...")
    happy = convert_happay_card(xl)
    print(f"  -> {len(happy)} records")

    print("Converting Drive Track & Porter...")
    drive = convert_drive_track_porter(xl)
    print(f"  -> {len(drive)} records")

    print("Converting Reviews...")
    reviews = convert_reviews(xl)
    print(f"  -> {len(reviews)} records")

    # Build output matching STORAGE_KEYS from constants.js
    seed_data = {
        'accounts_general': general,
        'accounts_transport': transport,
        'accounts_packing': packing,
        'accounts_petty': petty,
        'accounts_refunds': refunds,
        'accounts_happy': happy,
        'accounts_drive': drive,
        'accounts_reviews': reviews,
    }

    total = sum(len(v) for v in seed_data.values())
    print(f"\nTotal records: {total}")

    with open(OUTPUT_FILE, 'w') as f:
        json.dump(seed_data, f, indent=2, default=str)

    print(f"Written to {OUTPUT_FILE}")
    print(f"File size: {len(json.dumps(seed_data, default=str)) / 1024:.1f} KB")


if __name__ == '__main__':
    main()
