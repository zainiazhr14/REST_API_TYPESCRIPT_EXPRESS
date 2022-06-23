export interface resultListModel {
  from: any,
  foreignField: string,
  localField: string,
  as: string
}

export interface returnListModel {
  result: resultListModel,
  ref: any
}

export interface createQueryInterface {
  query?: any,
  search?: any,
  queryAndSearch?: any,
  queryInPopulate?: any
}
export interface createQueryInterface {
  [key: string]: any
}