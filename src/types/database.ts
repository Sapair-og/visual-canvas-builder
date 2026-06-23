export type DatabaseProvider = 'mongodb' | 'supabase' | 'firebase';

export interface FirebaseConfigDetails {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

export interface DatabaseConfig {
  provider: DatabaseProvider;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  mongodbUri?: string;
  firebaseConfig?: FirebaseConfigDetails;
}

export type DatabaseFieldType = 'string' | 'number' | 'boolean' | 'date';

export interface DatabaseColumn {
  name: string;
  type: DatabaseFieldType;
  primaryKey?: boolean;
  nullable?: boolean;
}

export interface DatabaseTable {
  id: string;
  name: string;
  columns: DatabaseColumn[];
  provider: DatabaseProvider;
  x: number;
  y: number;
}

export interface DataBinding {
  id: string;
  nodeId: string;
  tableId: string;
  columnName: string;
  bindType: 'read' | 'write';
}
