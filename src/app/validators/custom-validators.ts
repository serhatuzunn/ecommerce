import { FormControl, ValidationErrors } from "@angular/forms";

export class CustomValidators {

    //Whitespace validation
    static notOnlyWhiteSpace(control: FormControl): ValidationErrors {
        debugger;
        //check if string only contains whitespace
        if ((control.value != null) && (control.value.trim().length === 0)) { 
            //invalid return error object
            return { 'notOnlyWhiteSpace': true };
        } else {
            //valid return null
            return null!;
        }

        
    }
}
