// Proposed RFC 9457 error contract; confirm with Spring Boot before integration.
export interface ApiProblem {
  readonly type?: string;
  readonly title?: string;
  readonly status?: number;
  readonly detail?: string;
  readonly instance?: string;
}
