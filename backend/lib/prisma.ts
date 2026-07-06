import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type TableName = 
  | 'User' | 'Trainer' | 'Course' | 'Enrolment' | 'Milestone'
  | 'TransactionLedger' | 'Payout' | 'Review' | 'Dispute'
  | 'SessionLog' | 'Notification' | 'PlatformConfig';

function buildQuery(table: TableName) {
  return supabase.from(table);
}

function resolveInclude(select: string, include?: Record<string, any>, parentTable?: TableName): string {
  if (!include) return select;
  const relations: string[] = [];
  for (const [key, val] of Object.entries(include)) {
    const relKey = camelToPascal(key);
    const relTable = relKey as TableName;
    let embedKey = key;
    if (parentTable === 'User' && relTable === 'Trainer') {
      embedKey = `${key}:Trainer!userId`;
    }
    if (val === true) relations.push(`${embedKey}(*)`);
    else if (typeof val === 'object' && val.select) {
      const nested = Array.isArray(val.select) 
        ? val.select.join(',') 
        : Object.keys(val.select).join(',');
      relations.push(`${embedKey}(${nested || '*'})`);
    } else relations.push(`${embedKey}(*)`);
  }
  return `${select},${relations.join(',')}`;
}

function camelToPascal(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function applyWhere(q: any, where?: Record<string, any>): any {
  if (!where) return q;
  for (const [key, val] of Object.entries(where)) {
    if (key === 'AND' && Array.isArray(val)) {
      val.forEach((cond: any) => { q = applyWhere(q, cond); });
    } else if (key === 'OR' && Array.isArray(val)) {
      // simplified: just apply first condition
      if (val.length > 0) q = applyWhere(q, val[0]);
    } else if (key === 'NOT' && typeof val === 'object') {
      for (const [k, v] of Object.entries(val)) q = q.neq(k, v);
    } else if (val !== undefined && val !== null) {
      if (typeof val === 'object' && 'in' in val) {
        q = q.in(key, val.in);
      } else if (typeof val === 'object' && 'contains' in val) {
        q = q.contains(key, val.contains);
      } else if (typeof val === 'object' && 'startsWith' in val) {
        q = q.ilike(key, `${val.startsWith}%`);
      } else if (typeof val === 'object' && 'endsWith' in val) {
        q = q.ilike(key, `%${val.endsWith}`);
      } else if (typeof val === 'object' && 'lte' in val) {
        q = q.lte(key, val.lte);
      } else if (typeof val === 'object' && 'gte' in val) {
        q = q.gte(key, val.gte);
      } else if (typeof val === 'object' && 'lt' in val) {
        q = q.lt(key, val.lt);
      } else if (typeof val === 'object' && 'gt' in val) {
        q = q.gt(key, val.gt);
      } else {
        q = q.eq(key, val);
      }
    }
  }
  return q;
}

function applyOrderBy(q: any, orderBy?: Record<string, 'asc' | 'desc'> | Record<string, 'asc' | 'desc'>[]): any {
  if (!orderBy) return q;
  const arr = Array.isArray(orderBy) ? orderBy : [orderBy];
  arr.forEach(o => {
    const [key, dir] = Object.entries(o)[0];
    q = q.order(key, { ascending: dir === 'asc' });
  });
  return q;
}

function result(data: any, include?: Record<string, any>) {
  if (!data) return null;
  if (include) {
    for (const key of Object.keys(include)) {
      if (data[key] && Array.isArray(data[key]) && include[key] === true) {
        // keep as-is
      }
    }
  }
  return data;
}

export const prisma = {
  _table(table: TableName) {
    const self = this as any;
    return {
      findUnique: async (args: { where: Record<string, any>; include?: Record<string, any> }) => {
        const q = buildQuery(table);
        const fields = resolveInclude('*', args.include, table);
        const { data, error } = await applyWhere(q.select(fields), args.where).maybeSingle();
        if (error) throw error;
        return result(data, args.include);
      },
      findFirst: async (args: { where?: Record<string, any>; include?: Record<string, any>; orderBy?: any }) => {
        const q = buildQuery(table);
        const fields = resolveInclude('*', args.include, table);
        let qb = applyWhere(q.select(fields), args.where);
        if (args.orderBy) qb = applyOrderBy(qb, args.orderBy);
        const { data, error } = await qb.limit(1).maybeSingle();
        if (error) throw error;
        return result(data, args.include);
      },
      findMany: async (args: { where?: Record<string, any>; include?: Record<string, any>; orderBy?: any; skip?: number; take?: number } = {}) => {
        const q = buildQuery(table);
        const fields = resolveInclude('*', args.include, table);
        let qb = applyWhere(q.select(fields), args.where);
        if (args.orderBy) qb = applyOrderBy(qb, args.orderBy);
        if (args.skip) qb = qb.range(args.skip, args.skip + (args.take || 10) - 1);
        else if (args.take) qb = qb.limit(args.take);
        const { data, error } = await qb;
        if (error) throw error;
        return (data || []).map((d: any) => result(d, args.include));
      },
      create: async (args: { data: Record<string, any>; include?: Record<string, any>; select?: Record<string, any> }) => {
        const q = buildQuery(table);
        const fields = args.select ? Object.keys(args.select).join(',') : '*';
        const { data, error } = await q.insert(args.data).select(fields).single();
        if (error) throw error;
        return data;
      },
      update: async (args: { where: Record<string, any>; data: Record<string, any>; include?: Record<string, any> }) => {
        const q = buildQuery(table);
        const fields = resolveInclude('*', args.include, table);
        let qb = q.update(args.data).select(fields);
        qb = applyWhere(qb, args.where);
        const { data, error } = await qb.maybeSingle();
        if (error) throw error;
        return result(data, args.include);
      },
      upsert: async (args: { where: Record<string, any>; create: Record<string, any>; update: Record<string, any>; include?: Record<string, any> }) => {
        // Check existing
        const existing = await (this as any)[table].findUnique({ where: args.where });
        if (existing) {
          return (this as any)[table].update({ where: args.where, data: args.update, include: args.include });
        }
        return (this as any)[table].create({ data: { ...args.create }, include: args.include });
      },
      delete: async (args: { where: Record<string, any> }) => {
        const q = buildQuery(table);
        const { data, error } = await applyWhere(q.delete(), args.where).select().maybeSingle();
        if (error) throw error;
        return data;
      },
      deleteMany: async (args: { where: Record<string, any> }) => {
        const q = buildQuery(table);
        const { error } = await applyWhere(q.delete(), args.where);
        if (error) throw error;
        return { count: 0 };
      },
      count: async (args: { where?: Record<string, any> } = {}) => {
        const q = buildQuery(table);
        const { count, error } = await applyWhere(q.select('*', { count: 'exact', head: true }), args.where);
        if (error) throw error;
        return count || 0;
      },
      aggregate: async (_args: any) => {
        return { _avg: {}, _sum: {}, _count: 0 };
      },
      findRaw: async (_args: any) => ({ data: [] }),
      aggregateRaw: async (_args: any) => ({ data: [] }),
    };
  },
} as any;

const tables: TableName[] = [
  'User', 'Trainer', 'Course', 'Enrolment', 'Milestone',
  'TransactionLedger', 'Payout', 'Review', 'Dispute',
  'SessionLog', 'Notification', 'PlatformConfig',
];

for (const table of tables) {
  prisma[table.charAt(0).toLowerCase() + table.slice(1)] = prisma._table(table);
}

export { supabase as supabaseAdmin };
