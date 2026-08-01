export interface PublicQuestion {
  id: string;
  contract_id: string;
  question: string;
}

export interface MissingInfoCase {
  id: string;
  contract_id: string;
  question: string;
  expected_behaviour: string;
}

export const PUBLIC_QUESTIONS: PublicQuestion[] = [
  {
    "id": "PQ-01",
    "contract_id": "C-001",
    "question": "Review the automatic renewal clause. What is the risk level and why?"
  },
  {
    "id": "PQ-02",
    "contract_id": "C-001",
    "question": "Review the payment clause against the company standard."
  },
  {
    "id": "PQ-03",
    "contract_id": "C-002",
    "question": "Who owns the custom work, and does this match the company standard?"
  },
  {
    "id": "PQ-04",
    "contract_id": "C-003",
    "question": "Review the data breach notification time."
  },
  {
    "id": "PQ-05",
    "contract_id": "C-003",
    "question": "Does the security clause require encryption of stored data?"
  },
  {
    "id": "PQ-06",
    "contract_id": "C-004",
    "question": "Review the termination clause."
  },
  {
    "id": "PQ-07",
    "contract_id": "C-004",
    "question": "Will this contract renew automatically?"
  },
  {
    "id": "PQ-08",
    "contract_id": "C-005",
    "question": "Review the ownership of campaign materials."
  },
  {
    "id": "PQ-09",
    "contract_id": "C-006",
    "question": "Review the limitation of liability clause."
  },
  {
    "id": "PQ-10",
    "contract_id": "C-006",
    "question": "Does the termination-for-breach clause provide time to fix a normal breach?"
  },
  {
    "id": "PQ-11",
    "contract_id": "C-007",
    "question": "Review the confidentiality period."
  },
  {
    "id": "PQ-12",
    "contract_id": "C-008",
    "question": "Review the automatic renewal clause."
  }
];

export const MISSING_INFO_CASES: MissingInfoCase[] = [
  {
    "id": "MI-01",
    "contract_id": "C-004",
    "question": "What notice is required to stop automatic renewal?",
    "expected_behaviour": "The system should report that the contract has no automatic renewal clause and return Not Enough Information. It must not invent a notice period."
  },
  {
    "id": "MI-02",
    "contract_id": "C-007",
    "question": "Can either party terminate the agreement for convenience?",
    "expected_behaviour": "The system should report that the provided excerpt has no termination clause and return Not Enough Information."
  },
  {
    "id": "MI-03",
    "contract_id": "C-008",
    "question": "What is the total liability cap?",
    "expected_behaviour": "The system should report that no limitation of liability clause is available in the provided excerpt and return Not Enough Information."
  }
];
