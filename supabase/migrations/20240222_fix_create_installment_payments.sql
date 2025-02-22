
CREATE OR REPLACE FUNCTION public.create_installment_payments()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    due_date DATE;
    i INTEGER;
BEGIN
    -- Calcula a data de vencimento inicial baseada no dia de vencimento e data de início
    due_date := date_trunc('month', NEW.start_date) + 
                (NEW.due_day - 1) * INTERVAL '1 day';
    
    -- Se o dia já passou neste mês, avança para o próximo
    IF due_date < NEW.start_date THEN
        due_date := due_date + INTERVAL '1 month';
    END IF;

    -- Cria uma parcela para cada mês
    FOR i IN 1..NEW.installments LOOP
        INSERT INTO payments (
            client_id,
            description,
            amount,
            due_date,
            payment_method,
            status,
            installment_number,
            total_installments,
            created_at,
            updated_at
        ) VALUES (
            NEW.client_id,
            NEW.description || ' (' || i || '/' || NEW.installments || ')',
            NEW.amount,
            due_date,
            NEW.payment_method,
            'pending',
            i,
            NEW.installments,
            NOW(),
            NOW()
        );
        
        -- Avança para o próximo mês
        due_date := due_date + INTERVAL '1 month';
    END LOOP;

    -- Atualiza o número da parcela atual no recebimento recorrente
    NEW.current_installment := 1;
    
    RETURN NEW;
END;
$function$;
