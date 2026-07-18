import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type TableName =
  | 'User'
  | 'Trainer'
  | 'Course'
  | 'Enrolment'
  | 'Milestone'
  | 'TransactionLedger'
  | 'Payout'
  | 'Review'
  | 'Dispute'
  | 'SessionLog'
  | 'Notification'
  | 'PlatformConfig';

function buildQuery(table: TableName) {
  return supabaseAdmin.from(table);
}

function camelToPascal(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function resolveInclude(select: string, include?: Record<string, any>, parentTable?: TableName): string {
  if (!include) return select;
  const relations: string[] = [];
  for (const [key, val] of Object.entries(include)) {
    if (key === '_count') continue;
    const relKey = camelToPascal(key);
    const relTable = relKey as TableName;
    let embedKey = key;
    if (parentTable === 'User' && relTable === 'Trainer') {
      embedKey = `${key}:Trainer!userId`;
    }
    if (val === true) relations.push(`${embedKey}(*)`);
    else if (typeof val === 'object' && val.select) {
      const nested = Array.isArray(val.select) ? val.select.join(',') : Object.keys(val.select).join(',');
      relations.push(`${embedKey}(${nested || '*'})`);
    } else relations.push(`${embedKey}(*)`);
  }
  if (relations.length === 0) return select;
  return `${select},${relations.join(',')}`;
}

function applyWhere(q: any, where?: Record<string, any>): any {
  if (!where) return q;
  for (const [key, val] of Object.entries(where)) {
    if (key === 'AND' && Array.isArray(val)) {
      val.forEach((cond: any) => {
        q = applyWhere(q, cond);
      });
    } else if (key === 'OR' && Array.isArray(val)) {
      if (val.length > 0) q = applyWhere(q, val[0]);
    } else if (key === 'NOT' && typeof val === 'object') {
      for (const [k, v] of Object.entries(val)) q = q.neq(k, v);
    } else if (val !== undefined && val !== null) {
      if (typeof val === 'object' && 'in' in val) {
        q = q.in(key, val.in);
      } else if (typeof val === 'object' && 'contains' in val) {
        q = q.ilike(key, `${val.contains}%`);
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
      } else if (typeof val === 'object' && 'not' in val) {
        if (val.not === null) q = q.not(key, 'is', null);
        else q = q.neq(key, val.not);
      } else if (typeof val === 'object' && 'mode' in val) {
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
  arr.forEach((o) => {
    const [key, dir] = Object.entries(o)[0];
    q = q.order(key, { ascending: dir === 'asc' });
  });
  return q;
}

function resolveUpdateData(data: Record<string, any>, current: Record<string, any>): Record<string, any> {
  const resolved: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val !== null && typeof val === 'object') {
      if ('increment' in val) {
        resolved[key] = (current[key] || 0) + val.increment;
      } else if ('decrement' in val) {
        resolved[key] = Math.max(0, (current[key] || 0) - val.decrement);
      } else {
        resolved[key] = val;
      }
    } else {
      resolved[key] = val;
    }
  }
  return resolved;
}

function createTableMethods(table: TableName) {
  const findUnique = async (args: { where: Record<string, any>; include?: Record<string, any> }) => {
    const q = buildQuery(table);
    const fields = resolveInclude('*', args.include, table);
    const { data, error } = await applyWhere(q.select(fields), args.where).maybeSingle();
    if (error) throw error;
    return data;
  };

  const findFirst = async (
    args: { where?: Record<string, any>; include?: Record<string, any>; orderBy?: any } = {},
  ) => {
    const q = buildQuery(table);
    const fields = resolveInclude('*', args.include, table);
    let qb = applyWhere(q.select(fields), args.where);
    if (args.orderBy) qb = applyOrderBy(qb, args.orderBy);
    const { data, error } = await qb.limit(1).maybeSingle();
    if (error) throw error;
    return data;
  };

  const findMany = async (
    args: {
      where?: Record<string, any>;
      include?: Record<string, any>;
      orderBy?: any;
      skip?: number;
      take?: number;
    } = {},
  ) => {
    const q = buildQuery(table);
    const fields = resolveInclude('*', args.include, table);
    let qb = applyWhere(q.select(fields), args.where);
    if (args.orderBy) qb = applyOrderBy(qb, args.orderBy);
    if (args.skip && args.take) qb = qb.range(args.skip, args.skip + args.take - 1);
    else if (args.take) qb = qb.limit(args.take);
    const { data, error } = await qb;
    if (error) throw error;
    return data || [];
  };

  const create = async (args: {
    data: Record<string, any>;
    include?: Record<string, any>;
    select?: Record<string, any>;
  }) => {
    const q = buildQuery(table);
    const fields = args.select ? Object.keys(args.select).join(',') : '*';
    const { data, error } = await q.insert(args.data).select(fields).single();
    if (error) throw error;
    return data;
  };

  const update = async (args: {
    where: Record<string, any>;
    data: Record<string, any>;
    include?: Record<string, any>;
  }) => {
    const hasNumericOp = Object.values(args.data).some(
      (v: any) => v !== null && typeof v === 'object' && ('increment' in v || 'decrement' in v),
    );
    let resolvedData = args.data;
    if (hasNumericOp) {
      const { data: current } = await applyWhere(buildQuery(table).select('*'), args.where).maybeSingle();
      if (current) resolvedData = resolveUpdateData(args.data, current);
    }
    const fields = resolveInclude('*', args.include, table);
    let qb = buildQuery(table).update(resolvedData).select(fields);
    qb = applyWhere(qb, args.where);
    const { data, error } = await qb.maybeSingle();
    if (error) throw error;
    return data;
  };

  const upsert = async (args: {
    where: Record<string, any>;
    create: Record<string, any>;
    update: Record<string, any>;
    include?: Record<string, any>;
  }) => {
    const existing = await findUnique({ where: args.where });
    if (existing) return update({ where: args.where, data: args.update, include: args.include });
    return create({ data: { ...args.create }, include: args.include });
  };

  const del = async (args: { where: Record<string, any> }) => {
    const q = buildQuery(table);
    const { data, error } = await applyWhere(q.delete(), args.where).select().maybeSingle();
    if (error) throw error;
    return data;
  };

  const deleteMany = async (args: { where: Record<string, any> }) => {
    const q = buildQuery(table);
    const { error } = await applyWhere(q.delete(), args.where);
    if (error) throw error;
    return { count: 0 };
  };

  const count = async (args: { where?: Record<string, any> } = {}) => {
    const q = buildQuery(table);
    const { count: cnt, error } = await applyWhere(q.select('*', { count: 'exact', head: true }), args.where);
    if (error) throw error;
    return cnt || 0;
  };

  const updateMany = async (args: { where: Record<string, any>; data: Record<string, any> }) => {
    let qb = buildQuery(table).update(args.data);
    qb = applyWhere(qb, args.where);
    const { error } = await qb;
    if (error) throw error;
    return { count: 0 };
  };

  const aggregate = async (_args: any) => ({ _avg: {}, _sum: {}, _count: 0 });

  const groupBy = async (args: {
    by: string[];
    where?: Record<string, any>;
    _count?: Record<string, any>;
    _sum?: Record<string, any>;
  }) => {
    let qb = buildQuery(table).select('*');
    qb = applyWhere(qb, args.where);
    const { data, error } = await qb;
    if (error) throw error;
    if (!data || data.length === 0) return [];
    const groups: Record<string, any[]> = {};
    for (const row of data) {
      const key = args.by.map((b: string) => row[b]).join('|');
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    }
    return Object.entries(groups).map(([_, rows]) => {
      const result: any = {};
      for (const b of args.by) result[b] = rows[0][b];
      if (args._count) {
        result._count = {};
        for (const field of Object.keys(args._count)) {
          result._count[field] = rows.length;
        }
      }
      if (args._sum) {
        result._sum = {};
        for (const [field, val] of Object.entries(args._sum)) {
          if (val === true) result._sum[field] = rows.reduce((acc: number, r: any) => acc + (r[field] || 0), 0);
        }
      }
      return result;
    });
  };

  return {
    findUnique,
    findFirst,
    findMany,
    create,
    update,
    upsert,
    delete: del,
    deleteMany,
    count,
    updateMany,
    aggregate,
    groupBy,
  };
}

const tables: TableName[] = [
  'User',
  'Trainer',
  'Course',
  'Enrolment',
  'Milestone',
  'TransactionLedger',
  'Payout',
  'Review',
  'Dispute',
  'SessionLog',
  'Notification',
  'PlatformConfig',
];

const supabaseDb: Record<string, any> = {};
for (const table of tables) {
  const key = table.charAt(0).toLowerCase() + table.slice(1);
  supabaseDb[key] = createTableMethods(table);
}

supabaseDb.$transaction = async function <T>(fn: (tx: any) => Promise<T>, _options?: any): Promise<T> {
  const tx: any = {};
  for (const table of tables) {
    const key = table.charAt(0).toLowerCase() + table.slice(1);
    tx[key] = createTableMethods(table);
  }
  tx.$transaction = supabaseDb.$transaction;
  return await fn(tx);
};

export { supabaseDb };
