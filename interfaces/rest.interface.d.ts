export interface queryData {
  list(req: any): void;
  get(req: any): void;
  remove(req: any): void;
  update(req: any): void;
  createOrUpdate(findQuery: any, insertedData: any): void;
  createBulk(dataBulk: any[], req: any): void;
  // summary(req: any): void;
  // summaryCustom(req: any): void;
}

export interface resultQuery {
  error: any,
  data: object | null
}

export interface requestCreate {
  auth: { 
    credentials: { 
      type: string; 
      id: any; 
      name: any; 
    }; 
  }; 
  payload: { 
    created_by: any;
    created_by_name: string; 
    created_by_admin: any; 
    created_by_admin_name: string;
  };
}

export interface requestUpdate {
  auth: { 
    credentials: { 
      type: string; 
      id: any; 
      name: any; 
    }; 
  }; 
  payload: any;
  params: {
    id: any
  }
}

export interface requestGet {
  query: { 
    populate: string;
  }; 
  params: { 
    id: any; 
  }
}

export interface resultBulk {
  success?: any,
  error?: any
}

export interface summary {
  query: { 
    start: any; 
    end: any; 
    type: any; 
    column: any; 
    q: any; 
    search: any; 
    populate: any; 
  }; 
}

export interface summaryCustom {
  payload: { 
    q: any; 
  }; 
}