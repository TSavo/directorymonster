declare module 'snarkjs' {
  export namespace groth16 {
    export function fullProve(
      input: Record<string, any>,
      wasmFile: string,
      zkeyFile: string
    ): Promise<{
      proof: {
        pi_a: string[] | number[];
        pi_b: (string[] | number[])[];
        pi_c: string[] | number[];
        protocol: string;
        curve: string;
      };
      publicSignals: string[];
    }>;

    export function verify(
      vKey: any,
      publicSignals: string[],
      proof: {
        pi_a: string[] | number[];
        pi_b: (string[] | number[])[];
        pi_c: string[] | number[];
        protocol: string;
        curve: string;
      }
    ): Promise<boolean>;

    export function exportSolidityCallData(
      publicSignals: string[],
      proof: any
    ): Promise<string>;
  }

  export namespace powersOfTau {
    export function new(
      curve: string,
      power: number,
      outputFile: string,
      verbose: boolean
    ): Promise<void>;

    export function contribute(
      ptauFile: string,
      outputFile: string,
      name: string,
      entropy: string,
      verbose: boolean
    ): Promise<void>;

    export function preparePhase2(
      ptauFile: string,
      outputFile: string,
      verbose: boolean
    ): Promise<void>;
  }

  export namespace zKey {
    export function newZKey(
      r1csFile: string,
      ptauFile: string,
      zkeyFile: string
    ): Promise<void>;

    export function contribute(
      zkeyFile: string,
      outputFile: string,
      name: string,
      entropy: string,
      verbose: boolean
    ): Promise<void>;

    export function beacon(
      zkeyFile: string,
      outputFile: string,
      name: string,
      beaconHash: string,
      numIterations: number,
      verbose: boolean
    ): Promise<void>;

    export function verifyFromR1cs(
      r1csFile: string,
      ptauFile: string,
      zkeyFile: string,
      verbose: boolean
    ): Promise<boolean>;

    export function verifyFromInit(
      initZkeyFile: string,
      ptauFile: string,
      zkeyFile: string,
      verbose: boolean
    ): Promise<boolean>;

    export function exportVerificationKey(
      zkeyFile: string,
      vkeyFile: string
    ): Promise<void>;

    export function exportSolidityVerifier(
      zkeyFile: string,
      solidityFile: string
    ): Promise<void>;
  }

  export namespace wtns {
    export function calculate(
      input: Record<string, any>,
      wasmFile: string,
      wtnsFile: string
    ): Promise<void>;

    export function exportJson(
      wtnsFile: string,
      jsonFile: string
    ): Promise<void>;
  }
}
